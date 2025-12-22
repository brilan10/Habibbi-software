import React from 'react';

const Header = ({ title = "Habibbi Software" }) => {
  return (
    <header className="header">
      <div className="container">
        <h1 className="title">{title}</h1>
        <nav className="nav">
          <a href="/" className="nav-link">Inicio</a>
          <a href="/about" className="nav-link">Acerca de</a>
          <a href="/contact" className="nav-link">Contacto</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
