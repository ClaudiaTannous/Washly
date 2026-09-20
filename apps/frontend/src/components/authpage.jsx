"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const consent = localStorage.getItem("washly-cookie-consent");
    const userId = localStorage.getItem("userId");

    console.log("CONSENT:", consent);
    console.log("USER:", userId);

    if (consent === "accepted" && userId) {
      router.replace("/customer");
    }
  }, []);

  const [isLogin, setIsLogin] = useState(true);

  // === LOGIN STATES ===
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // === SIGNUP STATES ===
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleLogin() {
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 MUST BE INCLUDED for cookies
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (res.status === 404) return setLoginError("Email not found.");
      if (res.status === 401) return setLoginError("Incorrect password.");
      if (!res.ok) return setLoginError("Error logging in.");

      // 🔥 Save ONLY the userId (NOT the token)
      if (data.user?.id) {
        localStorage.setItem("userId", data.user.id);
      }

      window.location.href = "/customer";
    } catch (err) {
      setLoginError("Server error. Try again later.");
    }
  }

  // === SIGNUP HANDLER ===
  async function handleSignup() {
    setSignupError("");
    setSignupSuccess("");

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phone ||
      !country ||
      !city ||
      !street
    ) {
      setSignupError("All fields must be filled.");
      return;
    }

    if (!isValidEmail(email)) {
      setSignupError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          country_name: country,
          city_name: city,
          street_name: street,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Registration failed.");
        return;
      }

      setSignupSuccess("Account created successfully! Redirecting...");

      // 🔥 CLEAR ALL INPUTS AFTER SUCCESS
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setCountry("");
      setCity("");
      setStreet("");

      // 🔥 SWITCH TO LOGIN PAGE AFTER 1.5s
      setTimeout(() => {
        setIsLogin(true);
      }, 1500);
    } catch (err) {
      setSignupError("Server error. Try again later.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF8FB] to-[#C7ECF5]">
      <div className="relative w-[850px] h-[480px] rounded-2xl overflow-hidden washly-glow">
        {/* STEADY LOGO */}
        <img
          src="/washly-logo (3).png"
          alt="Washly Logo"
          className="
         absolute top-0 left-0
         -translate-y-6
         w-32 h-32
         z-50
         "
        />

        {/* Sliding Panel Background */}
        <div
          className={`
            absolute inset-0 transition-transform duration-700 ease-in-out
            bg-gradient-to-br from-[#0a1f2e] to-[#42C3D1]
            ${isLogin ? "translate-x-0" : "-translate-x-1/2"}
          `}
        />

        {/* LOGIN PANEL */}
        <div
          className={`
            absolute top-0 left-0 w-1/2 h-full p-10 flex flex-col justify-center
            bg-black/40 backdrop-blur-md text-white transition-opacity duration-700
            ${isLogin ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <h2 className="text-3xl font-bold mb-6">Login</h2>

          <label className="text-sm">Email</label>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full mb-4 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          <label className="text-sm">Password</label>
          <div className="relative mb-2 mt-1">
            <input
              type={showLoginPassword ? "text" : "password"}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-transparent border-b border-gray-300 py-2 pr-10 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-0 top-2 text-gray-300 hover:text-white"
            >
              {showLoginPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}{" "}
            </button>
          </div>

          {/* LOGIN ERROR DISPLAY */}
          {loginError && (
            <p className="text-red-400 text-sm mb-2">{loginError}</p>
          )}

          <button
            onClick={handleLogin}
            className="
              w-full py-3 rounded-full text-white font-semibold
              bg-gradient-to-r from-[#86BECC] to-[#42C3D1]
              shadow-lg hover:opacity-90 transition
            "
          >
            Login
          </button>

          <p className="text-sm mt-4">
            Don't have an account?
            <span
              className="cursor-pointer text-[#42C3D1] font-medium"
              onClick={() => setIsLogin(false)}
            >
              {" "}
              Sign Up
            </span>
          </p>
        </div>

        {/* RIGHT WELCOME PANEL FOR LOGIN */}
        <div
          className={`
            absolute right-0 top-0 w-1/2 h-full p-10 text-white flex flex-col justify-center transition-opacity duration-700
            ${isLogin ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <h1 className="text-4xl font-extrabold">
            WELCOME
            <br />
            TO WASHLY
          </h1>
          <p className="mt-4 text-sm w-64">
            We're happy to see you. Please log into your Washly account.
          </p>
        </div>

        {/* SIGNUP PANEL */}
        <div
          className={`
            absolute right-0 top-0 w-1/2 h-full p-10 flex flex-col 
            bg-black/40 backdrop-blur-md text-white transition-opacity duration-700
            overflow-y-auto max-h-full
            ${isLogin ? "opacity-0 pointer-events-none" : "opacity-100"}
          `}
        >
          <h2 className="text-3xl font-bold mb-6">Sign Up</h2>

          {/* FIRST NAME */}
          <label className="text-sm">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full mb-3 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* LAST NAME */}
          <label className="text-sm">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full mb-3 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* PHONE */}
          <label className="text-sm">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-3 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* COUNTRY */}
          <label className="text-sm">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full mb-3 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* CITY */}
          <label className="text-sm">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full mb-3 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* STREET */}
          <label className="text-sm">Street</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full mb-4 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* EMAIL */}
          <label className="text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 mt-1 bg-transparent border-b border-gray-300 py-2 focus:outline-none"
          />

          {/* PASSWORD */}
          <label className="text-sm">Password</label>

          <div className="relative mb-6 mt-1">
            <input
              type={showSignupPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-gray-300 py-2 pr-10 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setShowSignupPassword(!showSignupPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition"
            >
              {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {signupError && <p className="text-red-400 text-sm">{signupError}</p>}
          {signupSuccess && (
            <p className="text-green-400 text-sm">{signupSuccess}</p>
          )}

          <button
            onClick={handleSignup}
            className="
    w-full py-3 rounded-full text-white font-semibold
    bg-gradient-to-r from-[#86BECC] to-[#42C3D1]
    shadow-lg hover:opacity-90 transition
  "
          >
            Sign Up
          </button>

          <p className="text-sm mt-4">
            Already have an account?
            <span
              className="cursor-pointer text-[#42C3D1] font-medium"
              onClick={() => setIsLogin(true)}
            >
              {" "}
              Login
            </span>
          </p>
        </div>

        {/* LEFT WELCOME PANEL FOR SIGNUP */}
        <div
          className={`
            absolute left-0 top-0 w-1/2 h-full p-10 text-white flex flex-col justify-center transition-opacity duration-700
            ${isLogin ? "opacity-0 pointer-events-none" : "opacity-100"}
          `}
        >
          <h1 className="text-4xl font-extrabold">
            WELCOME
            <br />
            TO WASHLY!
          </h1>
          <p className="mt-4 text-sm w-64">
            Create your account and start connecting with our services.
          </p>
        </div>
      </div>
    </div>
  );
}
