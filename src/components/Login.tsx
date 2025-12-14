import { useState } from 'react';
import { Users } from 'lucide-react';

interface LoginProps {
  onLogin: (user: string) => void;
}

const users = [
  { name: 'Issam Abahmane', password: 'issam123' },
  { name: 'Mehdi Kridid', password: 'mehdi123' },
  { name: 'Yassine Faradi', password: 'yassine123' },
  { name: 'Zakaria Essabir', password: 'zakaria123' },
  { name: 'Admin', password: 'admin123' }
];

export function Login({ onLogin }: LoginProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!selectedUser || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const user = users.find(u => u.name === selectedUser);
    if (user && user.password === password) {
      setError('');
      onLogin(selectedUser);
    } else {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2">EUROHINCA</h1>
          <p className="text-slate-600">Système de Gestion de Stock</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="user-select" className="block text-slate-700 mb-2">
              Sélectionnez votre nom
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choisir un utilisateur --</option>
              {users.map((user) => (
                <option key={user.name} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre mot de passe"
            />
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!selectedUser || !password}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}