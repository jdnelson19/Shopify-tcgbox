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

const formatMoney = (cents) => {
  const value = Number(cents || 0) / 100;
  return `$${value.toFixed(2)}`;
};

const cartDrawer = document.querySelector("[data-cart-drawer]");
const cartDrawerBody = document.querySelector("[data-cart-drawer-body]");
const cartPage = document.querySelector("[data-cart-page]");

const renderItemProperties = (item) => {
  return Object.entries(item.properties || {})
    .filter(([key, value]) => value && !String(key).startsWith("_"))
    .map(([key, value]) => `<div>${key}: ${value}</div>`)
    .join("");
};

const updateCartCount = (count) => {
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(count);
  });
};

const renderCartDrawer = (cart) => {
  if (!cartDrawerBody) {
    return;
  }

  updateCartCount(cart.item_count);

  if (cart.item_count === 0) {
    cartDrawerBody.innerHTML = `
      <div class="cart-drawer__empty" data-cart-empty>
        <p>Your cart is currently empty.</p>
        <a class="button button--accent" href="/collections/all">Continue shopping</a>
      </div>
    `;
    return;
  }

  const itemsHtml = cart.items
    .map((item, index) => {
      const props = renderItemProperties(item);

      return `
        <article class="cart-drawer-item">
          <a href="${item.url}" class="cart-drawer-item__image">
            ${item.image ? `<img src="${item.image}" alt="${item.product_title}">` : ""}
          </a>
          <div class="stack-sm">
            <a href="${item.url}"><strong>${item.product_title}</strong></a>
            ${item.variant_title && item.variant_title !== "Default Title" ? `<div class="cart-drawer-item__meta">${item.variant_title}</div>` : ""}
            ${props ? `<div class="cart-drawer-item__meta">${props}</div>` : ""}
            <div class="cart-drawer-item__price">${formatMoney(item.final_line_price)}</div>
            <div class="cart-qty" data-line-index="${index + 1}" data-line-key="${item.key}">
              <button type="button" class="cart-qty__button" data-qty-change="decrease" aria-label="Decrease quantity">←</button>
              <span class="cart-qty__value">${item.quantity}</span>
              <button type="button" class="cart-qty__button" data-qty-change="increase" aria-label="Increase quantity">→</button>
            </div>
            <button type="button" class="cart-drawer-item__remove" data-remove-line="${index + 1}" data-line-key="${item.key}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");

  cartDrawerBody.innerHTML = `
    <div class="cart-drawer__items" data-cart-items>${itemsHtml}</div>
    <div class="cart-drawer__footer" data-cart-summary>
      <div class="cart-drawer__subtotal">Subtotal: ${formatMoney(cart.total_price)}</div>
      <a class="button button--ghost" href="/cart">View cart</a>
      <a class="button button--accent" href="/checkout" data-drawer-checkout>Checkout</a>
    </div>
  `;
};

const renderCartPage = (cart) => {
  if (!cartPage) {
    return;
  }

  if (cart.item_count === 0) {
    cartPage.innerHTML = `
      <h1>Cart</h1>
      <p>Your cart is currently empty.</p>
      <a class="button button--accent" href="/collections/all">Continue shopping</a>
    `;
    return;
  }

  const itemsHtml = cart.items
    .map((item, index) => {
      const props = renderItemProperties(item);

      return `
        <article class="cart-drawer-item cart-page-item">
          <a href="${item.url}" class="cart-drawer-item__image">
            ${item.image ? `<img src="${item.image}" alt="${item.product_title}">` : ""}
          </a>

          <div class="stack-sm">
            <a href="${item.url}"><strong>${item.product_title}</strong></a>
            ${item.variant_title && item.variant_title !== "Default Title" ? `<div class="cart-drawer-item__meta">${item.variant_title}</div>` : ""}
            ${props ? `<div class="cart-drawer-item__meta">${props}</div>` : ""}
            <div class="cart-drawer-item__price">${formatMoney(item.final_line_price)}</div>

            <div class="cart-qty" data-line-index="${index + 1}" data-line-key="${item.key}" data-cart-page-qty>
              <button type="button" class="cart-qty__button" data-qty-change="decrease" aria-label="Decrease quantity">←</button>
              <span class="cart-qty__value">${item.quantity}</span>
              <button type="button" class="cart-qty__button" data-qty-change="increase" aria-label="Increase quantity">→</button>
            </div>

            <button type="button" class="cart-drawer-item__remove" data-remove-line="${index + 1}" data-line-key="${item.key}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");

  cartPage.innerHTML = `
    <h1>Cart</h1>
    <div class="cart-drawer__items" data-cart-page-items>${itemsHtml}</div>
    <div class="cart-drawer__footer cart-page-footer">
      <div class="stack-sm" style="max-width: 320px;">
        <div><strong>Subtotal: ${formatMoney(cart.total_price)}</strong></div>
        <a class="button button--ghost" href="/collections/all">Continue shopping</a>
        <a class="button button--accent" href="/checkout">Checkout</a>
      </div>
    </div>
  `;
};

const fetchCart = async () => {
  const response = await fetch("/cart.js", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cart");
  }

  return response.json();
};

const requestCartChange = async ({ lineIndex, lineKey, quantity }) => {
  const postChange = async (payload) => {
    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Cart change request failed");
    }

    return response.json();
  };

  if (Number.isInteger(lineIndex) && lineIndex > 0) {
    try {
      return await postChange({ line: lineIndex, quantity });
    } catch (error) {
      if (!lineKey) {
        throw error;
      }
    }
  }

  if (lineKey) {
    const cart = await fetchCart();
    const retryLine = cart.items.findIndex((item) => item.key === lineKey) + 1;

    if (retryLine > 0) {
      return postChange({ line: retryLine, quantity });
    }
  }

  throw new Error("Could not determine cart line item");
};

const openCartDrawer = async () => {
  if (!cartDrawer) {
    return;
  }

  try {
    const cart = await fetchCart();
    renderCartDrawer(cart);
  } catch (error) {
    return;
  }

  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeCartDrawer = () => {
  if (!cartDrawer) {
    return;
  }

  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

document.querySelectorAll("[data-open-cart-drawer]").forEach((button) => {
  button.addEventListener("click", () => {
    openCartDrawer();
  });
});

document.querySelectorAll("[data-close-cart-drawer]").forEach((button) => {
  button.addEventListener("click", () => {
    closeCartDrawer();
  });
});

if (cartDrawerBody) {
  cartDrawerBody.addEventListener("click", async (event) => {
    const increaseButton = event.target.closest("[data-qty-change]");
    const removeButton = event.target.closest("[data-remove-line]");

    if (!increaseButton && !removeButton) {
      return;
    }

    event.preventDefault();

    let lineIndex;
    let lineKey;
    let quantity;

    if (removeButton) {
      lineIndex = Number(removeButton.dataset.removeLine);
      lineKey = removeButton.dataset.lineKey;
      quantity = 0;
    } else if (increaseButton) {
      const container = increaseButton.closest("[data-line-index]");
      const quantityValue = container?.querySelector(".cart-qty__value");
      const currentQty = Number(quantityValue?.textContent || 0);
      const action = increaseButton.dataset.qtyChange;

      lineIndex = Number(container?.dataset.lineIndex);
      lineKey = container?.dataset.lineKey;
      quantity = action === "increase" ? currentQty + 1 : Math.max(currentQty - 1, 0);
    }

    if (!lineKey && (!Number.isInteger(lineIndex) || lineIndex < 1)) {
      return;
    }

    try {
      const cart = await requestCartChange({ lineIndex, lineKey, quantity });
      updateCartCount(cart.item_count);
      renderCartPage(cart);
      renderCartDrawer(cart);
    } catch (error) {
      console.error(error);
      return;
    }
  });
}

const applyCartPageChange = async (lineIndex, lineKey, quantity) => {
  try {
    const cart = await requestCartChange({ lineIndex, lineKey, quantity });
    updateCartCount(cart.item_count);
    renderCartDrawer(cart);
    renderCartPage(cart);
  } catch (error) {
    console.error(error);
    return;
  }
};

if (cartPage) {
  cartPage.addEventListener("click", async (event) => {
    const qtyButton = event.target.closest("[data-qty-change]");
    const removeButton = event.target.closest("[data-remove-line]");

    if (!qtyButton && !removeButton) {
      return;
    }

    event.preventDefault();

    if (removeButton) {
      const lineIndex = Number(removeButton.dataset.removeLine);
      const lineKey = removeButton.dataset.lineKey;
      await applyCartPageChange(lineIndex, lineKey, 0);
      return;
    }

    const qtyContainer = qtyButton.closest("[data-cart-page-qty]");
    const qtyValue = qtyContainer?.querySelector(".cart-qty__value");
    const lineIndex = Number(qtyContainer?.dataset.lineIndex);
    const lineKey = qtyContainer?.dataset.lineKey;
    const currentQty = Number(qtyValue?.textContent || 0);
    const quantity = qtyButton.dataset.qtyChange === "increase" ? currentQty + 1 : Math.max(currentQty - 1, 0);

    await applyCartPageChange(lineIndex, lineKey, quantity);
  });
}

document.querySelectorAll("form.js-variant-form").forEach((form) => {
  const optionInputs = Array.from(form.querySelectorAll("[data-variant-option]"));
  const variantInput = form.querySelector("[data-variant-id-input]");
  const variantJson = form.querySelector("script[data-product-variants]");
  const submitButton = form.querySelector("button[type='submit']");

  let variants = [];

  if (optionInputs.length && variantInput && variantJson) {
    try {
      variants = JSON.parse(variantJson.textContent || "[]");
    } catch (error) {
      variants = [];
    }
  }

  const updateVariant = () => {
    if (!optionInputs.length || !variantInput || !variants.length) {
      return;
    }

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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton?.disabled) {
      return;
    }

    try {
      await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: new FormData(form),
      });

      form.reset();
      updateVariant();
      await openCartDrawer();
    } catch (error) {
      window.location.href = "/cart";
    }
  });

  if (optionInputs.length) {
    updateVariant();
  }
});