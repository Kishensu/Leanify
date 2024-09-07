import './Header.scss'; 
import logo from '../assets/Logo-png/color_logo_transparent.png';

const Header = ({ children }) => {
  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="Logo" />
      </div>
      <div className="button-group">
        {children} 
      </div>
    </header>
  );
};

export default Header;