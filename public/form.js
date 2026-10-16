document.querySelector('form').addEventListener('input', (event) => {
  const field = event.target;
  if (field.maxLength >= 0 && field.value.length > field.maxLength) {
    field.value = field.value.slice(0, field.maxLength);
  }
});
