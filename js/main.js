/*==================================================================
						Global Variables
===================================================================*/
var cartItems = [];
var extras = [{name:"Hot Souce", price:10.99}, {name:"Cheese", price:15.49}];
var tableNumber = null;
var isNewOrder = "true";
var orderHistory = [];
var orderNumber = 1028;
var currentOrder = null;
const resturant = "LaPiazza";


/*==================================================================
							Firebase
===================================================================*/
const firebaseConfig = {
    apiKey: "AIzaSyB-ONpEfGsObnhbnEWoczi7KYnWw7lJQYA",
    authDomain: "smartserve-9e1e5.firebaseapp.com",
    databaseURL: "https://smartserve-9e1e5.firebaseio.com",
    projectId: "smartserve-9e1e5",
    storageBucket: "smartserve-9e1e5.appspot.com",
    messagingSenderId: "1070424995930",
    appId: "1:1070424995930:web:9437bd15d3755625e30063",
    measurementId: "G-2W5H7B4H2D"
};

const mainApp = firebase.initializeApp(firebaseConfig);
// const db = mainApp.firestore();
// const Inventory = db.collection("LaPiazzaInventory");
// const MenuRef = db.collection("LaPiazzaMenu");
// const OrdersRef = db.collection("Orders");
// const RequestsRef = db.collection("Requests");

// Reviews Project
var secondFirebaseConfig = {
	apiKey: "AIzaSyBI6MUyP0xyIQ_of3y62TVXl3tFyZfOjes",
	authDomain: "resturantsdata.firebaseapp.com",
	databaseURL: "https://resturantsdata.firebaseio.com",
	projectId: "resturantsdata",
	storageBucket: "resturantsdata.appspot.com",
	messagingSenderId: "272512424369",
	appId: "1:272512424369:web:b1e3b99e893ce40ead0590",
	measurementId: "G-3V2BX5DF5Q"
};
// Initialize Second Firebase Project
const ReviewsApp = firebase.initializeApp(secondFirebaseConfig, 'ReviewsProject');
const storageRef = ReviewsApp.storage().ref();
const ReviewsDB = ReviewsApp.firestore();
const ReviewsRef = ReviewsDB.collection('Reviews');
const Inventory = ReviewsDB.collection("TestInventory");
const MenuRef = ReviewsDB.collection("TestLaPiazzaMenu");
const OrdersRef = ReviewsDB.collection("TestOrders");
const RequestsRef = ReviewsDB.collection("TestRequests");
const EmployeesRef = ReviewsDB.collection("TestEmployees");

/*==================================================================
						Loading Respective Page
===================================================================*/
window.onload = function(){
    if (localStorage.getItem("isNewOrder") != null) {
		isNewOrder = localStorage.getItem("isNewOrder");
	}

	if (localStorage.getItem("orderHistory") != null) {
		orderHistory = JSON.parse(localStorage.getItem("orderHistory"));
	}

	if (sessionStorage.getItem("currentOrder") != null) {
		currentOrder = sessionStorage.getItem("currentOrder");
	}

    var url = window.location.href.split("/");
    var page = url[url.length - 1].trim();
    if (page.includes('?')) {
    	var segments = page.split('?');
    	page = segments[0];
    	tableNumber = segments[1];
    	sessionStorage.setItem("Table", tableNumber);
    }
	tableNumber = sessionStorage.getItem("Table");
	$('#table_number_menu').text(tableNumber);
    switch(page){
		case "menu.html":
		  	loadMenu();
		break;
		case "history.html":
		  	loadHistory();
		break;
		case "orderHistory.html":
		  	loadHistoryOrder();
		break;
		case "track_order.html":
		  	loadTrackOrder();
		break;
		case "reviewRestaurant.html":
		  	loadReviewPage();
		break;		
		default:
			loadMenu();
    }
}

/*==================================================================
							Menu Page
===================================================================*/
function loadMenu(){
    _.observe(cartItems, function() {
        notifyCart();
    });
	MenuRef.doc("categories").get().then((doc) =>{
		var docData = doc.data();
		var categories = docData.categories;
		categories.forEach((category) =>{
			var catImg = category + ".jpg";
			storageRef.child(catImg).getDownloadURL().then(function(url){
				if (url == null) {
					url = "../img/burger.jpg";
				}
				loadCatIn(category, url);
			}).catch((error) =>{
				const url = "../img/burger.jpg";
				loadCatIn(category, url);
			});
		});

		function loadCatIn(category, url){
			const catId = category.replace(/\s/g, '');
			var html = `<div class="category" id="${catId + "Btn"}">
							<button type="button" class="w3-card" data-toggle="collapse" data-target="#${catId}" style="background-image: url('${url}');">
								<div class="overlay">
									<h2>${category}<span class="w3-right"><i class="ti-angle-down"></i></span></h2>
								</div>
							</button>
							<div id="${catId}" class="collapse menu-items w3-card"></div>
						</div>`;
			$('#menu_categories').append(html);
			const subCats = docData[category];
			subCats.forEach((subCat) =>{
				var subCatId = subCat.replace(/\s/g, '');
				subCatId = subCatId.replace('&', '');
				var subHtml = `<div class="sub-category ${subCatId}">
									<h3>${subCat}</h3>
								</div>`;
				$('#'+catId).append(subHtml);
				MenuRef.where("subCate", "==", subCat).where("available", "==", true).orderBy("name").get().then((itemsSnapshot) =>{
					itemsSnapshot.forEach((item) =>{
						var itemData = item.data();
						itemData.id = item.id;
						var objectData = JSON.stringify(itemData);
						var itemHtml = `<div class="item" id="view_specify_meal">
											<button hidden>${objectData}</button>
											<h4 class="name">${itemData.name}</h4>
											<p class="description">
												${itemData.description}
											</p>
											<h4 class="price">R${itemData.price}</h4>
										</div>`;
						$('.'+subCatId).append(itemHtml);
					});
				});
			});
		}
	});

	$('#menu_categories').on('click', '#view_specify_meal', function(){
		const itemObject = JSON.parse($(this).find('button').text());
		$('#add_item').show();
		$('#update_specfication').hide();
		addToCart(itemObject);
	});

	$('#request_btn').on('click', function(){
		var modal = document.getElementById("request_modal");
		modal.style.display = "block";

		window.onclick = function(event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		}

		$('#closeRequest').on('click', function(){
			modal.style.display = "none";
		});
	});

	$('#send_request').off('click').on('click', function(){
		sendRequest();
	});

	$('#viewCart').on('click', function(){
		var modal = document.getElementById("cart_modal");
		modal.style.display = "block";

		window.onclick = function(event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		}

		$('#closeCart').on('click', function(){
			modal.style.display = "none";
		});
		loadCart();
	});

	$('.cart-item-list').off('click').on('click', '.fa-trash-o', function(){
		var itemDataString = $(this).closest('.align-self-center').find('p').text();
		var itemData = JSON.parse(itemDataString);
		removeFromCart(itemData);
		$(this).closest('li').remove();
	});
}

function notifyCart(){
	if (cartItems.length > 0) {
		$('#viewCart').find('span').addClass('notify');
		$('#place_order').text('Place Order');
	}else{
		$('#viewCart').find('span').removeClass('notify');
		$('#place_order').text('Go to Menu');
		$('#place_order').off('click').on('click', function(){
			var modal = document.getElementById("cart_modal");
			modal.style.display = "none";
		});
	}
}

function sendRequest(){
	var requestItems = [];
	const reqId = (new Date()).getTime().toString();
    $.each($(".select-request input:checked"), function(){
        requestItems.push($(this).val());
    });
	var requestNote = $('#waiter_message').val();
	var tableWaiter = "Unassigned";
    if (requestNote != null && requestNote.length > 0) {
    	requestItems.push(requestNote);
    }
    if (tableNumber == null || isNaN(tableNumber)) {
    	tableNumber = prompt('Please Enter your Table number', 'Takeaway');
    }
	if(currentOrder != null){
		OrdersRef.doc(currentOrder).get().then((order)=>{
			var mOrderData = order.data();
			tableWaiter = mOrderData.servedBy;
		});
	}
    showLoader();
    RequestsRef.doc(reqId).set({
		table: tableNumber,
		tableWaiter: tableWaiter,
    	requestItems: requestItems,
    	requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
    	responded: false
    }).then(()=>{
    	hideLoader();
    	showSnackbar("You will be attended shortly.");
    	var modal = document.getElementById("request_modal");
		modal.style.display = "none";
    }).catch((error) =>{
    	hideLoader();
    	showSnackbar(error.message);
    });
}

function addToCart(itemData){
	var modal = document.getElementById("specify_meal");
	modal.style.display = "block";

	const price = itemData.price;
	const sides = itemData.sides;
	const extras = itemData.extras;
	$('.item-full-details h3').text(itemData.name);
	$('.item-full-details span').text("R" + price);
	$('.item-full-details p').text(itemData.description);
	$('.total-price span').text('R'+price);

	$('#sides_radio').empty();
	if (sides != null && sides.length > 0) {
		for (var i = sides.length - 1; i >= 0; i--) {
			var side = sides[i];
			var sideHtml = `<div class="form-check">
								<label class="form-check-label">
									<input type="radio" class="form-check-input" name="serve_with" value="${side}">${side}
								</label>
							</div>`;
			$('#sides_radio').append(sideHtml);
		}
	}else{
		$('#sides_radio').closest('.option').hide();
	}

	if (extras != null) {
		extras.forEach((extra) =>{
			var extraHtml = `<div class="form-check">
								<label class="form-check-label">
									<input type="checkbox" class="form-check-input" name="sause" value="${extra.name}">${extra.name} 
									<p class="w3-right">&nbsp;<b>(R${extra.price})</b></p>
								</label>
							</div>`;
			$('#extras_div').append(extraHtml);
		});
	}else{
		$('#extras_div').closest('.option').hide();
	}

	$('#extras_div').off('click').on('click', 'input', function(){
		var name = $(this).val();
		var price = $(this).closest('.form-check-label').find('p').text().replace(/[R ()]/g,'');
		price = parseFloat(price);
		const extra = {name: name, price: price};
		addRemoveExtra(extras, extra);
		var total = parseFloat($('.total-price span').text().replace(/\R/g, ''));
		if ($(this).is(':checked')) {
			total = (total + price).toFixed(2);
		}else{
			total = (total - price).toFixed(2);
		}
		$('.total-price span').text('R'+total);
	});

	$('#number').on('input', function(){
		var qty = $(this).val();
		if (qty == null || qty < 0	) {
			qty = 0;
			$('#number').val(0);
		}
		var total = (+qty * +(price)).toFixed(2);
		$('.total-price span').text('R'+total);
	});

	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}

	$('#closeSpecifyMeal').on('click', function(){
		modal.style.display = "none";
	});

	$('#decrease').off('click').on('click', function(){
		decreaseValue(price);
	});

	$('#increase').off('click').on('click', function(){
		increaseValue(price);
	});

	$('#add_item').off('click').on('click', function(){
		var qty = $('#number').val();
		var note = $('#chef_message').val();
		var side = $('#sides_radio input:checked').val();
		const total = parseFloat($('.total-price span').text().replace(/\R/g, ''));
		if (side == null) {
			side = "Normal";
		}
		const cartItem = {qty: qty, itemInfo: itemData, chefNote: note, side: side, extras: extras, total: total};
		addItem(cartItem);
		$('#number').val(1);
		$('#chef_message').val('');
		modal.style.display = "none";
		showSnackbar(itemData.name + " has been added to cart");
	});
	
	$('#update_specfication').off('click').on('click', function(){
		var qty = $('#number').val();
		var note = $('#chef_message').val();
		var side = $('#sides_radio input:checked').val();
		const total = parseFloat($('.total-price span').text().replace(/\R/g, ''));
		if (side == null) {
			side = "Normal";
		}
		const cartItem = {qty: qty, itemInfo: itemData, chefNote: note, side: side, extras: extras, total: total};
		console.log(cartItem);
		addItem(cartItem);
		$('#number').val(1);
		$('#chef_message').val('');
		modal.style.display = "none";
		showSnackbar(itemData.name + " has been updated in cart");
		loadCart();
	});
}

function addItem(item){
	const index = cartItems.findIndex(x => x["itemInfo"]["name"] == item["itemInfo"]["name"]);
	if (index == -1) {
		cartItems.push(item);
	}else{
		cartItems[index] = item;
	}
}

function loadCart(){
	$('.cart-item-list').empty();
	$('#total-price-container').show();
	if (cartItems.length == 0) {
		showEmptyCart();
		return;
	}
	var mainTotal = 0;
	for (var i = 0; i < cartItems.length; i++) {
		var item = cartItems[i];
		var total = item.total;
		mainTotal = (+mainTotal + +total).toFixed(2);
		var itemExtras = 'none';
		var mExtras = item.extras;
		if (mExtras != null && mExtras.length != 0) {
			itemExtras = '';
			for (var n = mExtras.length - 1; n >= 0; n--) {
				var extra = mExtras[n];
				itemExtras = extra.name + ","
			}
		}
		var itemData = JSON.stringify(item["itemInfo"]);
		var sideChoosen = "";
		if(item.side != "Normal"){
			sideChoosen = "Serve with " + item.side;
		}
		var extrasVisibilty = "";
		if(itemExtras == "none"){
			extrasVisibilty = "hidden";
		}
		var itemHtml = `<li class="item">
                			<div class="w3-row">
                				<div class="w3-col" style="width: 60%">
                					<h4><span>${item.qty}</span> x ${item["itemInfo"]["name"]}</h4>
									<p>${sideChoosen}</p>
									<p ${extrasVisibilty}>Add Extras: ${itemExtras}</p>
                					<p class="chef_note_cart">${item.chefNote}</p>
                				</div>
                				<div class="w3-col align-items-center" style="width: 20%; padding-top: 15px;">
                					<span class="item-x-qty-price">R${total}</span>
                				</div>
                				<div class="w3-col align-self-center" style="width: 20%">
                					<div class="edit-delete-icons w3-right">
                						<i class="fa fa-edit edit_item_specification"></i><br>
                						<i class="fa fa-trash-o"></i>
                					</div>
                					<p hidden>${itemData}</p>
                				</div>
                			</div>
                		</li>`;
        $('.cart-item-list').append(itemHtml);
	}
	$('#cart_total').text('R' + mainTotal);

	$('.cart-item-list').off('click').on('click', '.edit_item_specification', function(){
		var itemDataString = $(this).closest('.align-self-center').find('p').text();
		var itemData = JSON.parse(itemDataString);
		$('#update_specfication').show()
		$('#add_item').hide();
		addToCart(itemData);
		var modal = document.getElementById("specify_meal");
		modal.style.display = "block";

		$('#number').val(item.qty);
		$('#chef_message').val(item.chefNote);

		window.onclick = function(event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		}

		$('#closeSpecifyMeal').on('click', function(){
			modal.style.display = "none";
		});
	});

	$('#place_order').off('click').on('click', function(){
		if (cartItems.length < 1) {
			showSnackbar("Please add some items to cart before placing an order");
			return;
		}
		if (tableNumber == null) {
			tableNumber = prompt("Enter Table number", "Takeaway");
		}
		var date = new Date();
		const id = date.getTime().toString();
		const nowTime = firebase.firestore.Timestamp.fromDate(new Date());
		var newPending = [];
		var total = 0;
		cartItems.forEach((item) =>{
			const itemId = item["itemInfo"]["id"];;
			var name = item["itemInfo"]["name"];
			var price = item["itemInfo"]["price"];
			var note = '';
			if (item.side != 'Normal') {
				note = "Serve with: " + item.side;
			}
			if (itemExtras != 'none') {
				note = note + ", Add Extra: " + itemExtras;
			}
			if(note == ""){
				note = item.chefNote;
			}else{
				note = note + ", " + item.chefNote;
			}
			
			var qty = item.qty;
			var subTotal = (+qty * +price).toFixed(2);
			total = (+total + +subTotal).toFixed(2);
			var itemCat = item["itemInfo"]["subCate"];
			var newItem = {itemId: itemId, itemStatus: 1, name: name, note: note,
				orderedAt: nowTime, quantity: qty, subCat: itemCat, subTotal: subTotal};
			newPending.push(newItem);
		});
		if (currentOrder == null) {
			var order = {isPaid: false, isTableOpen: true, servedBy: "Unassigned", table: tableNumber, 
				total: total, ballance: total, pendingItems: newPending, tableOpenedAt: nowTime, number: orderNumber};
			placeOrder(order, id);
		}else{
			showLoader();
			OrdersRef.doc(currentOrder).get().then((order) =>{
				if (order.exists) {
					var data = order.data();
					var oldTotal = data.total;
					var oldBalance = data.ballance;
					var newBalance = (+oldBalance + +total).toFixed(2);
					total = (+total + +oldTotal).toFixed(2);
					var oldPending = data.pendingItems;
					var finalPending = oldPending.concat(newPending);
					OrdersRef.doc(currentOrder).update({pendingItems: finalPending, total: total, ballance: newBalance})
					.then(() =>{
						hideLoader();
						showSnackbar("Items Added");
						cartItems = [];
						var modal = document.getElementById("cart_modal");
						modal.style.display = "none";
					}).catch((error) =>{
						hideLoader();
						showSnackbar(error.message);
					});
				}else{
					var order = {isPaid: false, isTableOpen: true, servedBy: "Unassigned", table: tableNumber, 
						total: total, ballance: total, pendingItems: newPending, tableOpenedAt: nowTime, number: orderNumber};
					placeOrder(order, id);
				}			
			});
		}
	});
}

function showEmptyCart() {
	$('.total-price-container').hide();
	$('.cart-item-list').append(`<h4 style="text-align: center; padding: 5px; color: #777; font-size: 16px;">No Items in cart, Please add some Items From Menu</h4>`);
}

function removeFromCart(obj){
	const index = cartItems.findIndex(x => x["itemInfo"]["name"] == obj.name);
    var total = $('#cart_total').text().replace('R', '');
    var itemTotal = cartItems[index].total;
    total = (+total - +itemTotal).toFixed(2);
    $('#cart_total').text('R' + total);
    if (index != -1) {
    	cartItems.splice(index, 1);
    }
    if (cartItems.length == 0) {
    	showEmptyCart();
    }
}

function placeOrder(order, id){
	showLoader();
	OrdersRef.doc(id).set(order).then(()=>{
		hideLoader();
		var modal = document.getElementById("cart_modal");
		modal.style.display = "none";
		sessionStorage.setItem("currentOrder", id);
		orderHistory.push(id);
		localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
		showSnackbar("Order Placed Succesully");
		cartItems = [];
		window.location.href = "track_order.html";
	}).catch((error) =>{
		hideLoader();
		showSnackbar(error.message);
	});
}

function increaseValue(price) {
	var value = parseInt(document.getElementById('number').value, 10);
	value = isNaN(value) ? 1 : value;
	value++;
	var total = (+value * +(price)).toFixed(2);
	$('.total-price span').text('R'+total);
	document.getElementById('number').value = value;
}

function decreaseValue(price) {
	var value = parseInt(document.getElementById('number').value, 10);
	value = isNaN(value) ? 1 : value;
	value < 2 ? value = 2 : '';
	value--;
	var total = (+value * +(price)).toFixed(2);
	$('.total-price span').text('R'+total);
	document.getElementById('number').value = value;
}

function addRemoveExtra(inArr, obj){
    const index = inArr.findIndex(x => x.name == obj.name);
    if (index == -1) {
    	inArr.push(obj);
    }else{
    	inArr.splice(index, 1);
    }
}

function openNav() {
 	document.getElementById("ss_clien_sidebar").style.width = "250px";
}

function closeNav() {
 	document.getElementById("ss_clien_sidebar").style.width = "0";
}

/*==============================================================================
				                History
===============================================================================*/
function loadHistory(){
	if (orderHistory != null && orderHistory.length > 0) {
		$('#order_history_div').empty();
		orderHistory.forEach((orderId) =>{
			if (orderId != currentOrder) {
				OrdersRef.doc(orderId).get().then((order) =>{
					if (order.exists) {
						var data = order.data();
						var date = ((data.tableOpenedAt).toDate()).toLocaleDateString('CA');
						var totalItems = (data.pendingItems).concat(data.servedItems);
						var orderHtml = `<div class="order-subview shadow-sm" id="view_order_history">
											<div class="header d-flex mb-2">
												<h3>Order #${data.number}</h3>
												<h3 class="ml-auto">${date}</h3>
											</div>
											<div class="footer d-flex">
												<h4><span>${totalItems.length}</span> Ordered Items</h4>
												<h4 class="ml-auto">R${data.total}</h4>
											</div>
											<p hidden>${orderId}</p>
										</div>`;
						$('#order_history_div').append(orderHtml);
					}
				});
			}
		});
	}

	$('#order_history_div').on('click', '.order-subview', function(){
		const clickedOrder = $(this).find('p').text();
		sessionStorage.setItem('historyOrder', clickedOrder);
		window.location.href = "orderHistory.html";
	});
}

/*==============================================================================
				                History Order
===============================================================================*/
function loadHistoryOrder(){
	const historyOrder = sessionStorage.getItem("historyOrder");
	if (historyOrder == null) {
		window.location.href == "menu.html";
	}else{
		OrdersRef.doc(historyOrder).get().then((order) =>{
			if (order.exists) {
				var data = order.data();
				var date = ((data.tableOpenedAt).toDate()).toLocaleDateString('CA');
				$('#order_number_history').text(data.number);
				$('#history_order_total').text("R" + data.total);
				$('#history_order_date').text(date);
				var pendingItems = data.pendingItems;
				var servedItems = data.servedItems;
				var servedBy = data.servedBy;
				if (servedBy == "Unassigned") {
					// Show order will be attended soon.
				}else{
					// Show you are being served by waiter name
				}
				if (servedItems != null && servedItems.length > 0) {
					pendingItems = pendingItems.concat(servedItems);
				}
				$('#history_order_items').empty();
				pendingItems.forEach((item) =>{
					var itemHtml = `<li class="item">
			                			<div class="w3-row">
			                				<div class="w3-col" style="width: 70%">
			                					<h4><span>${item.quantity}</span> x ${item.name}</h4>
			                					<p>${item.note}</p>
			                				</div>
			                				<div class="w3-col" style="width: 30%;">
			                					<span class="item-x-qty-price w3-right">R${item.subTotal}</span>
			                				</div>
			                			</div>
			                		</li>`;
			        $('#history_order_items').append(itemHtml);
				});
			}
		});
	}
}

/*==============================================================================
				                Track Order
===============================================================================*/
function loadTrackOrder(){
	if (currentOrder != null && currentOrder != "") {
		OrdersRef.doc(currentOrder).onSnapshot((order) =>{
			console.log('Is this working');
			var data = order.data();
			if (data.isTableOpen) {
				$('#order_number').text(data.number);
				$('#track_order_total').text("R" + data.total);
				var pendingItems = data.pendingItems;
				var servedItems = data.servedItems;
				var servedBy = data.servedBy;
				var orderDate = (data.tableOpenedAt).toDate();
				// $('#counter').text(moment(tableOpenedAt, "DD/MM/YYYY").fromNow());
				startTimer(orderDate);
				if (servedBy == "Unassigned") {
					// Show order will be attended soon.
				}else{
					// Show you are being served by waiter name
				}
				if (servedItems != null && servedItems.length > 0) {
					pendingItems.concat(servedItems);
				}
				$('#track_order_items').empty();
				pendingItems.forEach((item) =>{
					var currentStatus = item.itemStatus;
					var itemStatus = 'Your Order is recived';
					if (currentStatus == 2) {
						itemStatus = "Your Order is being prepared";
					}else if (currentStatus == 3) {
						itemStatus = "Your Order is ready to be served";
					}
					var itemHtml = `<li class="item">
			                			<div class="w3-row">
			                				<div class="w3-col" style="width: 70%">
			                					<h4><span>${item.quantity}</span> x ${item.name}</h4>
			                					<p>${item.note}</p>
			                				</div>
			                				<div class="w3-col" style="width: 30%;">
			                					<span class="item-x-qty-price w3-right">R${item.subTotal}</span>
			                				</div>
			                			</div>
			                		</li>`;
			        $('#track_order_items').append(itemHtml);
			        $('.current-status').tooltip('hide')
			          .attr('data-original-title', itemStatus);
				});
			}else{
				$('.order').empty();
				$('.order').append(`<h4 style="text-align: center; padding: 5px; color: #777; font-size: 16px;">No active Order, Go ahead and place an order!</h4>`);
				$('.add-items').find('a').text('Create Order');
				sessionStorage.removeItem("currentOrder");
			}	
		});
	}else{
		$('.order').empty();
		$('.order').append(`<h4 style="text-align: center; padding: 5px; color: #777; font-size: 16px;">No active Order, Go ahead and place an order!</h4>`);
		$('.add-items').find('a').text('Create Order');
	}
}

function startTimer(date){
	setInterval(function() {
		var nowDate = moment(new Date());
		var diff = nowDate.diff(date);
	    var time = moment.duration(diff);
	    var minutes = time.minutes();
	    var seconds = time.seconds();
	    if (minutes < 10) {
	    	minutes = "0" + minutes;
	    }
	    if (seconds < 10) {
	    	seconds = "0" + seconds;
	    }
	    var timer = minutes + ":" + seconds;
	    if (time.hours() > 0) {
	    	timer = time.hours() + ":" + minutes + ":" + seconds;
	    }
        $('#counter').text(timer);
    }, 1000);
}

/*==============================================================================
				                    Review Page
===============================================================================*/
function loadReviewPage(){
	var reviewQuestions = [];
	$('.question').on('click', 'input[class="select-star"]', function(){
		var Question = $(this).closest('.question').find('h3').text();
		var rating = $(this).val();
		const review = {question: Question, rating: rating};
		addReviewQuestion(reviewQuestions, review)
	});

	$('#submit_review').on('click', function(){
		var reviewText = $('#experience').val();
		const reviewId = (new Date).getTime().toString();
		const guestName = $('#review_name').val().trim();
		const guestEmail = $('#review_email').val().trim();
		if (guestName.length < 3 || guestEmail.length < 5) {
			showSnackbar("Please enter your name and email");
			$('#review_name').focus();
			return;
		}
		var overAllRating = calculateOverallRating(reviewQuestions);
		showLoader();
		ReviewsRef.doc(reviewId).set({
			resturant: resturant,
			reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
			questions: reviewQuestions,
			reviewText: reviewText,
			guestName: guestName,
			guestEmail: guestEmail,
			finalRating: overAllRating
		}).then(()=>{
			hideLoader();
			showSnackbar("Thank you for dining at " + resturant);
			window.location.href = "menu.html";
		}).catch((error) =>{
			hideLoader();
			console.log(error);
		});
	});
}

function calculateOverallRating(questions) {
	var totalRating = 0;
	questions.forEach((question)=>{
		totalRating += +question.rating;
	});
	var finalRating = +totalRating / questions.length;
	return finalRating;
}

function addReviewQuestion(array, review){
	const index = array.findIndex(x => x.question == review.question);
	if (index == -1) {
		array.push(review);
	}else{
		array[index] = review;
	}
}

/*==============================================================================
				                    Multi Page
===============================================================================*/
function showLoader(){
	var loaderHtml = '<div id="loader"><div></div><h4 id="progress"></h4></div>';
	if ($('body').find('#loader').length == 0) {
		$('body').append(loaderHtml);
	}
	$("#loader").addClass("loader");
}

function hideLoader(){
	$("#loader").removeClass("loader");
}

function showSnackbar(text){
	var snackbarHtml = '<div id="snackbar">'+text+'</div>';
	if ($('body').find('#snackbar').length == 0) {
		$('body').append(snackbarHtml);
	}else{
		$('#snackbar').text(text);
	}

	var x = document.getElementById("snackbar");

	x.className = "show";

	setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}