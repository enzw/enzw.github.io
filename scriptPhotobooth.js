const btn1 = document.getElementById('btn1');

btn1.addEventListener('click', () => {
  btn1.classList.toggle('active');
});

const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    // Hapus kelas "active" dari semua tombol
    buttons.forEach(btn => btn.classList.remove('active'));
    // Tambahkan kelas "active" ke tombol yang diklik
    button.classList.add('active');
  });
});