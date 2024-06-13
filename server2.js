const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Sample cache for storing product data (should use a proper caching mechanism)
let productCache = {};

// Fetch products from the provided API
async function fetchProductsFromApis(company, categoryname, n, minPrice, maxPrice) {
    const apiUrl = `http://20.244.56.144/products/companies/${company}/categories/${categoryname}/products?top=${n}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
        throw new Error('Error fetching products');
    }

    const products = response.data;

    // Generate unique IDs and cache the results
    products.forEach(product => {
        const productId = uuidv4();
        product.id = productId;
        productCache[productId] = product;
    });

    return products;
}

// Fetch product details from the provided API
async function fetchProductDetailsFromApis(company, categoryname, productid) {
    const apiUrl = `http://20.244.56.144/products/companies/${company}/categories/${categoryname}/products/${productid}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
        return null;
    }

    return response.data;
}

// Endpoint to retrieve top products within a category for a specific company
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

// Endpoint to retrieve details of a specific product
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
