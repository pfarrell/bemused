export function toggleDropdown(dropdownId) {
  event.stopPropagation();
  
  // Close all dropdowns first
  document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
    if (dropdown.id !== dropdownId) {
      dropdown.classList.remove('active');
    }
  });
  
  // Toggle the clicked dropdown
  const dropdown = document.getElementById(dropdownId);
  dropdown.classList.toggle('active');
}

// Close dropdowns when clicking elsewhere on the page
document.addEventListener('click', function() {
  document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
    dropdown.classList.remove('active');
  });
});
