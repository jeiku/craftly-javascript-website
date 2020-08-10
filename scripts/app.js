const client = contentful.createClient({
	// This is the space ID. A space is like a project folder in Contentful terms
	space: "zs20zpmtzel6",
	// This is the access token for this space. Normally you get both ID and the token in the Contentful web app
	accessToken: "qhadzrnSnGA6qAfsdTQ9360CH5TIRfw4wmIFvLVl85Y",
});

// console.log(client);

// variables
const menuToggler = document.querySelector(".menu-toggle");
const body = document.querySelector("body");
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productDOM = document.querySelector(".products-center");

// cart
let cart = [];
// buttons
let buttonsDOM = [];

// getting the products

// class Products {
//     async getProducts() {
//         try {
//             let result = await fetch("../products.json");
//             let data = await result.json();
//             return data;
//         } catch (error) {
//             console.log(error);
//         }
//     }
// }
class Products {
	async getProducts() {
		try {
			let contentful = await client.getEntries({
				content_type: "myProducts",
			});
			// console.log(contentful);

			// wait until we get the JSON file of products
			// let result = await fetch("../products.json");
			// wait until resolved into a javascript object
			// let data = await result.json();

			let products = contentful.items;
			// for each product, destructure the object into more readable array of product objects
			products = products.map((item) => {
				const { title, price } = item.fields;
				const { id } = item.sys;
				const image = item.fields.image.fields.file.url;
				return { title, price, id, image };
			});
			return products;
		} catch (error) {
			console.log(error);
		}
	}
}

// display products
class UI {
	displayProducts(products) {
		let result = "";
		// for each product object in the array of objects, give them proper HTML with product properties
		products.forEach((product) => {
			result += `
            <!-- single product -->
            <article class="product animate-up">
                <div class="img-container">
                    <img
                        src=${product.image}
                        alt="product"
                        class="product-img"
                    />
                    <button class="bag-btn" data-id=${product.id}>
                        <i class="fas fa-shopping-cart"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            <!-- end of single product -->
            `;
		});
		// add new HTML of each object to the DOM
		productDOM.innerHTML = result;
	}

	getBagButtons() {
		// select every bag button, make an array
		const buttons = [...document.querySelectorAll(".bag-btn")];
		buttonsDOM = buttons;
		// for each button..
		buttons.forEach((button) => {
			// get the specific bag ID (same as product)
			let id = button.dataset.id;
			// in the cart array, find product object that has the same ID as the button
			let inCart = cart.find((item) => item.id === id);
			// if THAT product is in the cart..
			if (inCart) {
				// change button HTML to say its in the cart
				button.innerText = "In Cart";
				// disable the button, so it cant be used
				button.disabled = true;
			} else {
				// if it is NOT in the cart...
				// make the button clickable
				button.addEventListener("click", (event) => {
					// when one of the buttons is clicked to be put in the cart..
					event.target.innerText = "In Cart";
					// disable the button, so it cant be used
					event.target.disabled = true;
					// get product from products based on id
					let cartItem = {
						...Storage.getProduct(id),
						amount: 1,
					};
					// add anything new into the cart, plus the new product
					cart = [...cart, cartItem];
					// save cart in local storage
					Storage.saveCart(cart);
					// set cart values
					this.setCartValues(cart);
					// display cart item
					this.addCartItem(cartItem);
					// show the cart
					this.showCart();
				});
			}
		});
	}

	setCartValues(cart) {
		let tempTotal = 0;
		let itemsTotal = 0;
		cart.map((item) => {
			tempTotal += item.price * item.amount;
			itemsTotal += item.amount;
		});

		cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
		cartItems.innerText = itemsTotal;
	}

	addCartItem(item) {
		// create a div, add the item properties in the HTML
		const div = document.createElement("div");
		div.classList.add("cart-item");
		div.innerHTML = `
            <img src=${item.image} />
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fas fa-chevron-up" data-id=${item.id}></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fas fa-chevron-down" data-id=${item.id}></i>
            </div>
        `;

		cartContent.appendChild(div);
		//  console.log(cartContent);
	}

	showCart() {
		cartOverlay.classList.add("transparentBcg");
		cartDOM.classList.add("showCart");
	}

	setupAPP() {
		// get the current cart array of product objects
		cart = Storage.getCart();
		// set the current carts prices and item amounts
		this.setCartValues(cart);
		// add cart items to the cart DOM
		this.populateCart(cart);
		// add cart button show and hide functionality
		cartBtn.addEventListener("click", this.showCart);
		closeCartBtn.addEventListener("click", this.hideCart);
	}

	populateCart(cart) {
		// loop throught the array of objects
		cart.forEach((item) => {
			// for each product object, add it to the cart DOM
			this.addCartItem(item);
		});
	}

	hideCart() {
		cartOverlay.classList.remove("transparentBcg");
		cartDOM.classList.remove("showCart");
	}

	cartLogic() {
		// clear cart button
		clearCartBtn.addEventListener("click", () => {
			this.clearCart();
		});

		// cart functionality
		cartContent.addEventListener("click", (event) => {
			if (event.target.classList.contains("remove-item")) {
				let removeItem = event.target;
				let id = removeItem.dataset.id;
				cartContent.removeChild(removeItem.parentElement.parentElement);
				this.removeItem(id);
			} else if (event.target.classList.contains("fa-chevron-up")) {
				let addAmount = event.target;
				let id = addAmount.dataset.id;
				let tempItem = cart.find((item) => item.id === id);
				tempItem.amount = tempItem.amount + 1;
				Storage.saveCart(cart);
				this.setCartValues(cart);
				addAmount.nextElementSibling.innerText = tempItem.amount;
			} else if (event.target.classList.contains("fa-chevron-down")) {
				let lowerAmount = event.target;
				let id = lowerAmount.dataset.id;
				let tempItem = cart.find((item) => item.id === id);
				tempItem.amount = tempItem.amount - 1;
				if (tempItem.amount > 0) {
					Storage.saveCart(cart);
					this.setCartValues(cart);
					lowerAmount.previousElementSibling.innerText = tempItem.amount;
				} else {
					cartContent.removeChild(lowerAmount.parentElement.parentElement);
					this.removeItem(id);
				}
			}
		});
	}

	clearCart() {
		// create new array of cart item IDs
		let cartItems = cart.map((item) => item.id);
		// for each ID number, remove the item with that ID
		cartItems.forEach((id) => this.removeItem(id));
		console.log(cartContent.children);

		while (cartContent.children.length > 0) {
			cartContent.removeChild(cartContent.children[0]);
		}

		this.hideCart();
	}

	removeItem(id) {
		// update cart with ONLY items that dont match the ID you send in (removing that ID)
		cart = cart.filter((item) => item.id !== id);
		// reset the cart values
		this.setCartValues(cart);
		// re-save the cart
		Storage.saveCart(cart);
		// get the button with this ID
		let button = this.getSingleButton(id);
		// make it clickable again
		button.disabled = false;
		// change HTML to show it is clickable again
		button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
	}

	getSingleButton(id) {
		// in array of bag buttons (all with .bag-button class), finds and returns the button with the provided ID
		return buttonsDOM.find((button) => button.dataset.id === id);
	}
}

// local storage
class Storage {
	static saveProducts(products) {
		localStorage.setItem("products", JSON.stringify(products));
	}

	static getProduct(id) {
		let products = JSON.parse(localStorage.getItem("products"));
		return products.find((product) => product.id === id);
	}

	static saveCart(cart) {
		localStorage.setItem("cart", JSON.stringify(cart));
	}

	static getCart(id) {
		return localStorage.getItem("cart")
			? JSON.parse(localStorage.getItem("cart"))
			: [];
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const ui = new UI();
	const products = new Products();
	window.sr = ScrollReveal();

	menuToggler.addEventListener("click", function () {
		body.classList.toggle("open");
	});

	// setup app
	ui.setupAPP();

	// get all products
	products
		.getProducts()
		// after getting the list of product objects, display them in HTML and save them in storage
		.then((products) => {
			ui.displayProducts(products);
			Storage.saveProducts(products);
		})
		.then(() => {
			ui.getBagButtons();
			ui.cartLogic();
		})
		.then(() => {
			sr.reveal(".animate-up", {
				origin: "bottom",
				duration: 1000,
				distance: "25rem",
				delay: 450,
			});
		});
});
