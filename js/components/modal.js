// Modal logic for Z3n Marketplace
const modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeAll() {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  }
};

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) modal.closeAll();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') modal.closeAll();
});

export default modal;
