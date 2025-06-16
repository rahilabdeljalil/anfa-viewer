import React, { useState, useEffect } from 'react';
import '../styles/main.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 1, title: 'PROJET', link: '#projet' },
    { id: 2, title: 'COMMODITÉS', link: '#commodites' },
    { id: 3, title: 'EMPLACEMENT', link: '#emplacement' },
    { id: 4, title: 'EQUIPEMENTS', link: '#equipements' },
    { id: 5, title: 'PLAN DE MASSE', link: '#plan-de-masse' },
    { id: 6, title: 'PLAN', link: '#plan' },
    { id: 7, title: 'VIDÉO', link: '#video' },
    { id: 8, title: 'GALERIE', link: '#galerie' },
    { id: 9, title: 'BROCHURE', link: '#brochure' },
    { id: 10, title: 'CONTACT', link: '#contact' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/">
            <div className="logo-wrapper">
              <img  src="../public/assets/logo/logo_les_villas_dAnfa_marrakech_vf.png" alt="" srcset="" />
            </div>
          </a>
        </div>

        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <li key={item.id} className="navbar-item">
              <a 
                href={item.link} 
                className="navbar-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;