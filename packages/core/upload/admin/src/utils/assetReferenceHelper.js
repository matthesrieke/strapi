
export const createReferenceMarkup = (containerElementId, assetRefList) => {
    const container = document.getElementById(containerElementId);
    if (!container) {
        return;
    }
    
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
            const baseUri = document.location.href.substring(0, document.location.href.indexOf('/admin/'));
            const targetUrl = `${baseUri}/admin/content-manager/collectionType/${ref.collectionType}/${ref.id}`;
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

export const createWarningMessage = (containerElementId, warningMessage) => {
    const container = document.getElementById(containerElementId);
    if (!container) {
        return;
    }

    const assetWarningDiv = document.createElement('div');
    assetWarningDiv.classList = 'asset-references-warning';
    assetWarningDiv.innerHTML = warningMessage;
    container.appendChild(assetWarningDiv);
};

export const disableLoadingButton = (buttonElementId) => {
    const elem = document.getElementById(buttonElementId);
    if (elem) {
        elem.setAttribute('aria-disabled', true);
    }
}

export const enableLoadingButton = (buttonElementId) => {
    const elem = document.getElementById(buttonElementId);
    if (elem) {
        elem.setAttribute('aria-disabled', false);
    }
}

export const addLoadingIndicator = (containerElementId) => {
    const elem = document.getElementById(containerElementId);
    if (elem) {
        const indic = document.createElement('div');
        indic.id = 'references-loading-indicator';
        indic.innerText = '...loading references...';
        elem.appendChild(indic);
    }
    
}

export const removeLoadingIndicator = () => {
    const elem = document.getElementById('references-loading-indicator');
    if (elem) {
        elem.remove();
    }
}

