const chips = document.querySelectorAll('.chip');
const betDisplay = document.getElementById('betDisplay');

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('is-selected'));
    chip.classList.add('is-selected');
    betDisplay.textContent = `$${chip.dataset.value}`;
  });
});

const defaultChip = document.querySelector('.chip[data-value="250"]');
if (defaultChip) {
  defaultChip.classList.add('is-selected');
}
