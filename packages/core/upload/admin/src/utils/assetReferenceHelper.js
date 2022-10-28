
export const createReferenceMarkup = (containerElementId, assetRefList) => {
    const container = document.getElementById(containerElementId);
    const assetReferencesDiv = document.createElement('div');
    assetReferencesDiv.classList = 'asset-references-container';
    assetReferencesDiv.style = 'max-height: 25vh; overflow-y: scroll;';
    container.appendChild(assetReferencesDiv);

    for (const references of assetRefList) {
        const infoTextContainer = document.createElement('div');
        const infoText = document.createTextNode(`Asset is used in ${references.length} entries:`);
        infoTextContainer.appendChild(infoText);
        assetReferencesDiv.appendChild(infoTextContainer);

        const linkDiv = document.createElement('div');

        const maxLines = 5;
        let i = 0;
        references.forEach(ref => {
            if (i > maxLines) {
                return;
            }
            i = i + 1;
            const targetUrl = `/admin/content-manager/collectionType/${ref.collectionType}/${ref.id}`;
            const a = document.createElement('a');
            const text = document.createTextNode(targetUrl);
            a.appendChild(text);
            a.setAttribute('href', targetUrl);
            a.setAttribute('target', '_blank');
            const aDiv = document.createElement('div');
            aDiv.appendChild(a);
            linkDiv.appendChild(aDiv);
        });

        assetReferencesDiv.appendChild(linkDiv);
    }

};

export const disableLoadingButton = (buttonElementId) => {
    document.getElementById(buttonElementId).setAttribute('aria-disabled', true);
}

export const enableLoadingButton = (buttonElementId) => {
    document.getElementById(buttonElementId).setAttribute('aria-disabled', false);
}

export const addLoadingIndicator = (containerElementId) => {
    const indic = document.createElement('div');
    indic.id = 'references-loading-indicator';
    indic.innerText = '...loading references...';
    document.getElementById(containerElementId).appendChild(indic);
}

export const removeLoadingIndicator = () => {
    document.getElementById('references-loading-indicator').remove();
}

