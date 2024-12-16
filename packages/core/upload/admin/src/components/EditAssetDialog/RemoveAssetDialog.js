import React from 'react';

import { ConfirmDialog } from '@strapi/helper-plugin';
import PropTypes from 'prop-types';

import { useRemoveAsset } from '../../hooks/useRemoveAsset';
import getRequestUrl from '../../utils/getRequestUrl';
import axios from 'axios';
import { createReferenceMarkup, disableLoadingButton, enableLoadingButton, addLoadingIndicator, removeLoadingIndicator, createWarningMessage } from '../../utils/assetReferenceHelper';

export const RemoveAssetDialog = ({ onClose, asset }) => {
  // `null` means asset is deleted
  const { isLoading, removeAsset } = useRemoveAsset(() => onClose(null));

  const type = 'files';
  const url = getRequestUrl(`/${type}/${asset.id}?populate=references`);

  const axiosInstance = axios.create({
    baseURL: process.env.STRAPI_ADMIN_BACKEND_URL,
  });

  axiosInstance({
    url: `/api${url}`,
    method: 'GET',
    responseType: 'json',
  }).then((response) => {
    removeLoadingIndicator();
    if (response.data && response.data.references && response.data.references.length > 0) {
      const references = response.data.references;
      createReferenceMarkup('confirm-description', [references]);
    }
  }).catch((err) => {
    console.log('Could not resolve references', err);
    createWarningMessage('confirm-description', 'Could not load all references. Please contact your system administrator.');
  })
  .finally(() => {
    enableLoadingButton('confirm-delete');
  });

  window.setTimeout(() => {
    disableLoadingButton('confirm-delete');
    addLoadingIndicator('confirm-description');
  }, 0);

  const handleConfirm = () => {
    removeAsset(asset.id);
  };

  return (
    <ConfirmDialog
      isConfirmButtonLoading={isLoading}
      isOpen
      onToggleDialog={onClose}
      onConfirm={handleConfirm}
    />
  );
};

RemoveAssetDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  asset: PropTypes.shape({
    id: PropTypes.number,
    height: PropTypes.number,
    width: PropTypes.number,
    size: PropTypes.number,
    createdAt: PropTypes.string,
    ext: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
};
