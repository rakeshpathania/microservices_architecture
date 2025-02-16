const mongoose = require('mongoose');
const { CustomerModel, AddressModel } = require('../models');

//Dealing with data base operations
class CustomerRepository {

    async CreateCustomer({ email, password, phone, salt }){

        const customer = new CustomerModel({
            email,
            password,
            salt,
            phone,
            address: []
        })

        const customerResult = await customer.save();
        return customerResult;
    }
    
    async CreateAddress({ _id, street, postalCode, city, country}){
        
        const profile = await CustomerModel.findById(_id);
        
        if(profile){
            
            const newAddress = new AddressModel({
                street,
                postalCode,
                city,
                country
            })

            await newAddress.save();

            profile.address.push(newAddress);
        }

        return await profile.save();
    }

    async FindCustomer({ email }){
        const existingCustomer = await CustomerModel.findOne({ email: email });
        return existingCustomer;
    }

    async FindCustomerById({ id }){

        const existingCustomer = await CustomerModel.findById(id).populate('address');
        // existingCustomer.cart = [];
        // existingCustomer.orders = [];
        // existingCustomer.wishlist = [];

        // await existingCustomer.save();
        return existingCustomer;
    }

    async Wishlist(customerId){

        const profile = await CustomerModel.findById(customerId).populate('wishlist');
       
        return profile.wishlist;
    }

    async AddWishlistItem(customerId, { _id, name, desc, price, available, banner}){
        
        const product = {
            _id, name, desc, price, available, banner
        };

        const profile = await CustomerModel.findById(customerId).populate('wishlist');
       
        if(profile){

             let wishlist = profile.wishlist;
  
            if(wishlist.length > 0){
                let isExist = false;
                wishlist.map(item => {
                    if(item._id.toString() === product._id.toString()){
                       const index = wishlist.indexOf(item);
                       wishlist.splice(index,1);
                       isExist = true;
                    }
                });

                if(!isExist){
                    wishlist.push(product);
                }

            }else{
                wishlist.push(product);
            }

            profile.wishlist = wishlist;
        }

        const profileResult = await profile.save();      

        return profileResult.wishlist;

    }

    async RemoveFromWishlist(customerId, productId) {
        try {
            const profile = await CustomerModel.findById(customerId).populate('wishlist');
            
            if (profile) {
                let wishlist = profile.wishlist;
                
                // Find and remove the product
                const index = wishlist.findIndex(item => 
                    item._id.toString() === productId.toString()
                );
                
                if (index !== -1) {
                    wishlist.splice(index, 1);
                    profile.wishlist = wishlist;
                    
                    const updatedProfile = await profile.save();
                    return updatedProfile.wishlist;
                }
                
                throw new Error('Product not found in wishlist');
            }
            
            throw new Error('Customer not found');
            
        } catch (err) {
            throw new Error(`Failed to remove from wishlist: ${err.message}`);
        }
    }
    


    async AddCartItem(customerId, { _id, name, price, banner},qty, isRemove){

 
        const profile = await CustomerModel.findById(customerId).populate('cart');


        if(profile){ 
 
            const cartItem = {
                product: { _id, name, price, banner },
                unit: qty,
            };
          
            let cartItems = profile.cart;
            
            if(cartItems.length > 0){
                let isExist = false;
                 cartItems.map(item => {
                    if(item.product._id.toString() === _id.toString()){

                        if(isRemove){
                            cartItems.splice(cartItems.indexOf(item), 1);
                        }else{
                            item.unit = qty;
                        }
                        isExist = true;
                    }
                });

                if(!isExist){
                    cartItems.push(cartItem);
                } 
            }else{
                cartItems.push(cartItem);
            }

            profile.cart = cartItems;

            return await profile.save();
        }
        
        throw new Error('Unable to add to cart!');
    }



    async AddOrderToProfile(customerId, order){
 
        const profile = await CustomerModel.findById(customerId);

        if(profile){ 
            
            if(profile.orders == undefined){
                profile.orders = []
            }
            profile.orders.push(order);

            profile.cart = [];

            const profileResult = await profile.save();

            return profileResult;
        }
        
        throw new Error('Unable to add to order!');
    }

 


}

module.exports = CustomerRepository;
