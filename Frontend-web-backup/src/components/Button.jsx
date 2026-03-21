const Button = ({ children, onClick, className = '', ...props }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2 rounded-lg font-medium transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
