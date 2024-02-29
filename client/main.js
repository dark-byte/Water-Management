const productContainer = document.getElementById('products-container');
var cartItems = {}; // Object to store cart items

async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3000/products');
    const data = await response.json();

    if (data.products) {
        productContainer.innerHTML = ''
      data.products.forEach(product => {
        const productCard = createProductCard(product.product_name, product.description, product.price, product.product_id);
        productContainer.appendChild(productCard);
      });
    } else {
      console.error('Failed to fetch products');
    }
  } catch (error) {
    console.error(error);
  }
}

function createProductCard(productName, productDescription, productPrice, productId) {
    const productCard = document.createElement('div');
    productCard.classList.add('product-card');

    // Add data-productId attribute to the card
    productCard.dataset.productId = productId;

    productCard.innerHTML = `
        <h3>${productName}</h3>
        <p>${productDescription}</p>
        <p>Price: $${productPrice}</p>
        <label>Quantity:</label>
        <input type="number" name="quantity" value="1" min="1">
        <button onclick="handleOrderClick(event, ${productId})">Order</button>
    `;

  return productCard;
}

const orderButtons = document.querySelectorAll('.product-card button');

orderButtons.forEach(button => {
  button.addEventListener('click', async (event) => {
    const productId = event.currentTarget.dataset.productId;
    const quantity = document.getElementById('quantity').value;

    const date = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format

    try {
      const response = await fetch('http://localhost:3000/add-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity, date , username})
      });

      const data = await response.json();

      if (data.message === 'Order added successfully') {
        // Handle successful order placement (e.g., show a success message, update UI)
        alert("Order Successfully Placed!")
      } else {
        // Handle order failure (e.g., show an error message)
        alert("Error Occured!")
      }
    } catch (error) {
      console.error(error);
      // Handle network or other errors
    }
  });
});


async function handleOrderClick(event, productId) {
  
    const d = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format
  
    try {
      const response = await fetch('http://localhost:3000/add-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, date : d, username: username })
      });

  
      const res = await response.json();
  
      if (res.message === 'Order added successfully') {
        alert("Order Successfully Placed!");
      } else {
        alert(`Order Failed: ${res.message}`); // Use server response message
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while placing your order. Please try again later.");
    }
}

document.getElementById('logoutButton').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior (page refresh)

    // Clear localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('loginType');

    // Redirect to index.html
    window.location.href = 'index.html';
});



const username = localStorage.getItem('username');


if (!username) {
    // If username does not exist, redirect to index.html
    window.location.href = 'index.html';
} else {
    // If username exists, fetch products
    fetchProducts();
}

