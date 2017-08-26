import React from 'react';

export default function Container({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

Container.propTypes = {
  children: React.PropTypes.object,
};
