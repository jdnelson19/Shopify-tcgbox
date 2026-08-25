document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    const target = id ? document.querySelector(id) : null;

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.querySelectorAll("form.js-variant-form").forEach((form) => {
  const optionInputs = Array.from(form.querySelectorAll("[data-variant-option]"));
  const variantInput = form.querySelector("[data-variant-id-input]");
  const variantJson = form.querySelector("script[data-product-variants]");
  const submitButton = form.querySelector("button[type='submit']");

  if (!optionInputs.length || !variantInput || !variantJson) {
    return;
  }

  let variants = [];

  try {
    variants = JSON.parse(variantJson.textContent || "[]");
  } catch (error) {
    return;
  }

  const updateVariant = () => {
    const selectedValues = optionInputs.map((input) => input.value);
    const selectedVariant = variants.find((variant) => {
      return selectedValues.every((value, index) => variant[`option${index + 1}`] === value);
    });

    if (!selectedVariant) {
      if (submitButton) {
        submitButton.disabled = true;
      }
      return;
    }

    variantInput.value = selectedVariant.id;

    if (submitButton) {
      const addLabel = submitButton.dataset.addToCartLabel || "Add to cart";
      const soldLabel = submitButton.dataset.soldOutLabel || "Sold out";
      submitButton.disabled = !selectedVariant.available;
      submitButton.textContent = selectedVariant.available ? addLabel : soldLabel;
    }
  };

  optionInputs.forEach((input) => {
    input.addEventListener("change", updateVariant);
  });

  updateVariant();
});