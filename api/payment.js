"use client";
import { useState } from "react";

const Payment = () => {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputID, setInputID] = useState("");
  const [inputPassword, setInputPassword] = useState("");

  const handleLogin = () => {
    const validID = "micronanornd@paruluniversity.ac.in";
    const validPassword = "passwrd@123";

    if (inputID === validID && inputPassword === validPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid ID or Password!");
    }
  };

  const handleGenerateLink = async () => {
    const response = await fetch("/api/payment/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        email,
        phone,
      }),
    });

    const data = await response.json();
    if (data.link) {
      setPaymentLink(data.link); // Store the generated payment link
    } else {
      alert("Failed to generate payment link.");
    }
  };

  return (
    <div>
      <style jsx>{`
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background-color: #000; /* Black background */
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .container {
          margin-top: 10vh;
          background-color: #fff;
          width: 30vw;
          height: auto;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        h1 {
          margin-bottom: 1rem;
          color: #333;
          text-align: center;
        }

        form {
          width: 100%;
        }

        form div {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
        }

        input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
        }

        button {
          width: 100%;
          padding: 0.7rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        button:hover {
          background-color: #0056b3;
        }

        .payment-link {
          margin-top: 1rem;
          text-align: center;
        }

        .payment-link a {
          color: #007bff;
          text-decoration: none;
          font-weight: bold;
        }

        .payment-link a:hover {
          text-decoration: underline;
        }
      `}</style>

      {!isAuthenticated ? (
        <div className="container">
          <h1>Login</h1>
          <form onSubmit={(e) => e.preventDefault()}>
            <div>
              <label>ID:</label>
              <input
                type="email"
                value={inputID}
                onChange={(e) => setInputID(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                required
              />
            </div>
            <button type="button" onClick={handleLogin}>
              Login
            </button>
          </form>
        </div>
      ) : (
        <div className="container">
          <h1>Generate Payment Link</h1>
          <form onSubmit={(e) => e.preventDefault()}>
            <div>
              <label>Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Phone:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <button type="button" onClick={handleGenerateLink}>
              Generate Payment Link
            </button>
          </form>

          {paymentLink && (
            <div className="payment-link">
              <p>Share this link with the customer:</p>
              <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                {paymentLink}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;
