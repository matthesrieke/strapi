import React, { useState } from 'react';

import { Button } from '@strapi/design-system';
import { ConfirmDialog } from '@strapi/helper-plugin';
import { Trash } from '@strapi/icons';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { AssetDefinition, FolderDefinition } from '../../../constants';
import { useBulkRemove } from '../../../hooks/useBulkRemove';

import getRequestUrl from '../../../utils/getRequestUrl';
import axios from 'axios';
import { createReferenceMarkup, disableLoadingButton, enableLoadingButton, addLoadingIndicator, removeLoadingIndicator } from '../../../utils/assetReferenceHelper';

export const BulkDeleteButton = ({ selected, onSuccess }) => {
  const { formatMessage } = useIntl();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { isLoading, remove } = useBulkRemove();


  /**
   * method that retreives all references for selected assets
   * and visualizes a list of the entries
   */
  const retrieveAssetsWithReferences = () => {
    const axiosInstance = axios.create({
      baseURL: process.env.STRAPI_ADMIN_BACKEND_URL,
    });
    
    const type = 'files';

    const assetPromises = selected.map((sel) => {
      const url = getRequestUrl(`/${type}/${sel.id}?populate=references`);

      return axiosInstance({
        url: `/api${url}`,
        method: 'GET',
        responseType: 'json',
      });
    });
  
    Promise.all(assetPromises).then(responses => {
      removeLoadingIndicator();
      const assetRefList = responses.map(r => r.data.references || []);
      createReferenceMarkup('confirm-description', assetRefList);
    }).finally(() => {
      enableLoadingButton('confirm-delete');
    });
  
  
    window.setTimeout(() => {
      disableLoadingButton('confirm-delete');
      addLoadingIndicator('confirm-description');
    }, 0);
  };

  const handleConfirmRemove = async () => {
    await remove(selected);
    onSuccess();
  };

  return (
    <>
      <Button
        variant="danger-light"
        size="S"
        startIcon={<Trash />}
        onClick={() => {retrieveAssetsWithReferences(); setShowConfirmDialog(true)}}
      >
        {formatMessage({ id: 'global.delete', defaultMessage: 'Delete' })}
      </Button>

      <ConfirmDialog
        isConfirmButtonLoading={isLoading}
        isOpen={showConfirmDialog}
        onToggleDialog={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
};

BulkDeleteButton.propTypes = {
  selected: PropTypes.arrayOf(AssetDefinition, FolderDefinition).isRequired,
  onSuccess: PropTypes.func.isRequired,
};
