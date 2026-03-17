import { useState } from "react";
import axios from "axios";

export default function POS() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  const handleAdd = async () => {
    if (!barcode.trim()) return;

    try {
      setMessage("Searching product...");

      const res = await axios.get(
        "http://127.0.0.1:4015/api/intelligence/top-selling/taif-main?limit=20"
      );

      const products = Array.isArray(res?.data?.data) ? res.data.data : [];

      const product = products.find(
        (p) =>
          String(p.product_id) === barcode.trim() ||
          String(p.product_id).includes(barcode.trim())
      );

      if (!product) {
        setMessage("Product not found");
        return;
      }

      const unitPrice =
        Number(product.total_sold_qty) > 0
          ? Number(product.total_sales_value) / Number(product.total_sold_qty)
          : 0;

      const existingIndex = items.findIndex(
        (item) => item.product_id === product.product_id
      );

      if (existingIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingIndex].qty += 1;
        setItems(updatedItems);
      } else {
        const newItem = {
          product_id: product.product_id,
          name: product.product_name_ar,
          price: unitPrice,
          qty: 1,
        };

        setItems([...items, newItem]);
      }

      setBarcode("");
      setMessage(`Added: ${product.product_name_ar}`);
    } catch (error) {
      console.error(error);
      setMessage("API error");
    }
  };

  const handleRemove = (indexToRemove) => {
    const updatedItems = items.filter((_, index) => index !== indexToRemove);
    setItems(updatedItems);
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      setMessage("No items to save");
      return;
    }

    try {
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

      const res = await axios.post("http://127.0.0.1:4015/api/sale", {
        items,
        total,
      });

      if (res?.data?.success) {
        setMessage(`Sale saved successfully. ID: ${res.data.saleId}`);
        setItems([]);
      } else {
        setMessage("Sale save failed");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error saving sale");
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 POS Screen</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Scan Barcode..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          style={{ padding: 10, width: 300 }}
        />

        <button onClick={handleAdd} style={{ marginLeft: 10, padding: "10px 16px" }}>
          Add
        </button>
      </div>

      {message ? (
        <div style={{ marginBottom: 12, color: "#444", fontWeight: "bold" }}>
          {message}
        </div>
      ) : null}

      <hr />

      <h3>Items</h3>

      {items.length === 0 ? (
        <p>No items added yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Line Total</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.product_id}-${index}`}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.qty}</td>
                <td style={tdStyle}>{item.price.toFixed(2)}</td>
                <td style={tdStyle}>{(item.price * item.qty).toFixed(2)}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleRemove(index)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 20 }}>Total: {total.toFixed(2)}</h3>

      <button
        style={{ marginTop: 20, padding: 10 }}
        onClick={handleCompleteSale}
      >
        Complete Sale
      </button>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid #ccc",
  padding: "10px",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "10px",
};