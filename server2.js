const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;


let productCache = {};


async function fetchProductsFromApis(company, categoryname, n, minPrice, maxPrice) {
    const apiUrl = `http://20.244.56.144/products/companies/${company}/categories/${categoryname}/products?top=${n}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
        throw new Error('Error fetching products');
    }

    const products = response.data;


    products.forEach(product => {
        const productId = uuidv4();
        product.id = productId;
        productCache[productId] = product;
    });

    return products;
}


async function fetchProductDetailsFromApis(company, categoryname, productid) {
    const apiUrl = `http://20.244.56.144/products/companies/${company}/categories/${categoryname}/products/${productid}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
        return null;
    }

    return response.data;
}


app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { company, n = 10, minPrice = 0, maxPrice = 10000 } = req.query;

    if (n > 10) {
        return res.status(400).json({ error: "Maximum 'n' allowed is 10" });
    }

    try {
        const products = await fetchProductsFromApis(company, categoryname, n, minPrice, maxPrice);
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;
    const { company } = req.query;

    let product = productCache[productid];
    if (!product) {
        product = await fetchProductDetailsFromApis(company, categoryname, productid);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        productCache[productid] = product;
    }

    res.json({ product });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
