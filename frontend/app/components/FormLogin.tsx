"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function FormLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    if (!email || !password) {
      alert("Debes ingresar email y contraseña");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({  email, password }),

      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Correo o contraseña incorrectos");
        setLoading(false);
        return;
      }

      // 🔹 Guardar usuario y token en AuthContext

      const userData = { name: data.user.name, email: data.user.email, role: data.user.role };

      login(userData, data.access_token);

      // 🔹 Redirigir según rol
      if (userData.role === "admin") {
        router.push("/dashboard/admin");
      } else {

        router.push("/");

      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md flex flex-col items-center">
      <img src="/logo2.png" alt="Logo" height={60} width={60} className="mb-2" />

      <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">
        Iniciar Sesión
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
          loading
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-700 hover:bg-blue-800"
        }`}
      >
        {loading ? "Cargando..." : "Iniciar Sesión"}
      </button>

      <div className="mt-4">
        <a href="/login/register" className="text-blue-700 hover:underline">
          ¿No tienes una cuenta? Regístrate
        </a>
      </div>

    </div>
  );
}
