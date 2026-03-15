import homeIcon from '../pictures/Artfolio_logo.png';
import marketsIcon from '../pictures/Markets_Icon.png';
import investingIcon from '../pictures/Investing_Icon.png';

function SidebarNav({ currentPage, onPageChange }) {
  const navItems = [
    { key: 'home', label: 'Home', icon: homeIcon, alt: 'Artfolio home' },
    { key: 'markets', label: 'Markets', icon: marketsIcon, alt: 'Markets page' },
    { key: 'investing', label: 'How to invest', icon: investingIcon, alt: 'How to invest page' },
  ];

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-brand">A</div>

      <nav className="sidebar-links">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-link ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onPageChange(item.key)}
            title={item.label}
          >
            <span className="sidebar-icon">
              <img
                src={item.icon}
                alt={item.alt}
                className="sidebar-icon-image"
              />
            </span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default SidebarNav;