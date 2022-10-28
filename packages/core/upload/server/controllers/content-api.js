'use strict';

const { resolve } = require('path');
const { readdirSync, readFileSync } = require('fs');
const _ = require('lodash');
const utils = require('@strapi/utils');
const { getService } = require('../utils');
const { FILE_MODEL_UID } = require('../constants');
const validateUploadBody = require('./validation/content-api/upload');

const { sanitize } = utils;
const { ValidationError } = utils.errors;

const sanitizeOutput = (data, ctx) => {
  const schema = strapi.getModel(FILE_MODEL_UID);
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(data, schema, { auth });
};
const sanitizeQuery = (data, ctx) => {
  const schema = strapi.getModel(FILE_MODEL_UID);
  const { auth } = ctx.state;

  return sanitize.contentAPI.query(data, schema, { auth });
};


/**
 * resolve all API schemas with richtext content
 */
function getFiles(rootDir) {
  const dirs = readdirSync(rootDir, { withFileTypes: true });
  const files = dirs.map((dir) => {
    const res = resolve(rootDir, dir.name);
    return dir.isDirectory() ? getFiles(res) : (res.indexOf('schema.json') > 0 ? res : null);
  }).filter(f => f !== null);
  return Array.prototype.concat(...files);
}

const apiFiles = getFiles(resolve(strapi.dirs.app.api));

const contentTypes = [];

apiFiles.forEach(af => {
  let data = readFileSync(af);
  let asJson = JSON.parse(data);

  const name = asJson.info.singularName;
  const richTextFields = [];

  for (const key in asJson.attributes) {
    if (Object.hasOwnProperty.call(asJson.attributes, key)) {
      const element = asJson.attributes[key];
      if (element.type === 'richtext') {
        richTextFields.push(key);
      }
    }
  }

  if (richTextFields.length > 0) {
    contentTypes.push({ name: `api::${name}.${name}`, richTextFields: richTextFields });
  }

});


async function resolveReferences(file) {

  let results = {};

  /**
   * query relevant content types
   */
  for await (const ct of contentTypes) {
    const ors = []
    for (const rtf of ct.richTextFields) {
      const innerWhere = {
        [rtf]: {
          $contains: file.name,
        }
      };

      ors.push(innerWhere);
    }

    const queryResponse = await strapi.query(ct.name).findMany({
      where: {
        $or: ors
      }
    });
    results[ct.name] = queryResponse.map(e => e.id);

  }

  /**
   * query image attributes
   */

  // TODO where can we get this table name from?
  const FILES_RELATION_TABLE_NAME = 'files_related_morphs';
  const conn = strapi.db.getConnection(FILES_RELATION_TABLE_NAME);

  const queryRows = await conn.select('*').from(FILES_RELATION_TABLE_NAME).where({ file_id: file.id });

  for (const r of queryRows) {
    if (!results[r.related_type]) {
      results[r.related_type] = [];
    }
    if (results[r.related_type].indexOf(r.related_id) < 0) {
      results[r.related_type].push(r.related_id);
    }

  }

  /**
   * prepare response as array
   */
  const resultArray = []
  for (const key in results) {
    if (Object.hasOwnProperty.call(results, key)) {
      const entries = results[key];
      entries.forEach(entr => {
        resultArray.push({ collectionType: key, id: entr })
      });
    }
  }

  return resultArray;


};

module.exports = {
  async find(ctx) {
    const sanitizedParams = await sanitizeQuery(ctx.query, ctx);

    const files = await getService('upload').findMany(sanitizedParams);

    ctx.body = await sanitizeOutput(files, ctx);
  },

  async findOne(ctx) {
    const {
      params: { id },
    } = ctx;

    const sanitizedParams = await sanitizeQuery(ctx.query, ctx);
    const file = await getService('upload').findOne(id, sanitizedParams.populate);

    if (!file) {
      return ctx.notFound('file.notFound');
    }

    const payload = await sanitizeOutput(file, ctx);

    // add references if requested
    const parsedUrl = new URL(`https://dummy.host${ctx.req.url}`);
    console.log('parsedUrl.searchParams', parsedUrl.searchParams.has('populate'));
    if (parsedUrl.searchParams && parsedUrl.searchParams.has('populate') && parsedUrl.searchParams.get('populate') === 'references') {
      const references = await resolveReferences(file);
      payload.references = references;
    }

    ctx.body = payload;
  },

  async destroy(ctx) {
    const {
      params: { id },
    } = ctx;

    const file = await getService('upload').findOne(id);

    if (!file) {
      return ctx.notFound('file.notFound');
    }

    await getService('upload').remove(file);

    ctx.body = await sanitizeOutput(file, ctx);
  },

  async updateFileInfo(ctx) {
    const {
      query: { id },
      request: { body },
    } = ctx;
    const data = await validateUploadBody(body);

    const result = await getService('upload').updateFileInfo(id, data.fileInfo);

    ctx.body = await sanitizeOutput(result, ctx);
  },

  async replaceFile(ctx) {
    const {
      query: { id },
      request: { body, files: { files } = {} },
    } = ctx;

    // cannot replace with more than one file
    if (Array.isArray(files)) {
      throw new ValidationError('Cannot replace a file with multiple ones');
    }

    const replacedFiles = await getService('upload').replace(id, {
      data: await validateUploadBody(body),
      file: files,
    });

    ctx.body = await sanitizeOutput(replacedFiles, ctx);
  },

  async uploadFiles(ctx) {
    const {
      request: { body, files: { files } = {} },
    } = ctx;

    const data = await validateUploadBody(body, Array.isArray(files));

    const apiUploadFolderService = getService('api-upload-folder');

    const apiUploadFolder = await apiUploadFolderService.getAPIUploadFolder();

    if (Array.isArray(files)) {
      data.fileInfo = data.fileInfo || [];
      data.fileInfo = files.map((_f, i) => ({ ...data.fileInfo[i], folder: apiUploadFolder.id }));
    } else {
      data.fileInfo = { ...data.fileInfo, folder: apiUploadFolder.id };
    }

    const uploadedFiles = await getService('upload').upload({
      data,
      files,
    });

    ctx.body = await sanitizeOutput(uploadedFiles, ctx);
  },

  async upload(ctx) {
    const {
      query: { id },
      request: { files: { files } = {} },
    } = ctx;

    if (_.isEmpty(files) || files.size === 0) {
      if (id) {
        return this.updateFileInfo(ctx);
      }

      throw new ValidationError('Files are empty');
    }

    await (id ? this.replaceFile : this.uploadFiles)(ctx);
  },
};
