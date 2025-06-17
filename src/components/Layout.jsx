import React from 'react';

const Layout = ({ children, title = "Bemused - Music Streaming" }) => {
  // Update the document title
  React.useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="react-page-content">
      {children}
    </div>
  );
};

export default Layout;
