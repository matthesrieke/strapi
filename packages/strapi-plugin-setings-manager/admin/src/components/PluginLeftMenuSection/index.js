/**
*
* PluginLeftMenuSection
*
*/

import React from 'react';

import styles from './styles.scss';

class PluginLeftMenuSection extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={styles.pluginLeftMenuSection}>
        {this.props.section.name}
      </div>
    );
  }
}

export default PluginLeftMenuSection;
