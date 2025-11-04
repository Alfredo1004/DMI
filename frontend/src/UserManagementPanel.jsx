import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Power, Trash2, Edit, X, User, Shield } from 'lucide-react'; // Íconos de lucide-react

// URL base de la API (ajustar si es necesario)
const API_BASE_URL = 'http://localhost:5000/api';

// Componente de tabla con la lista de usuarios
const UserListTable = ({ users, onEdit, onDelete, currentAdminEmail }) => {
    return (
        <div className="mt-6 overflow-x-auto shadow-xl rounded-xl bg-gray-800">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                        // No mostrar el administrador que está actualmente logueado
                        user.email !== currentAdminEmail && (
                            <tr key={user._id} className="hover:bg-gray-700 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center">
                                    {user.role === 'admin' ? (
                                        <Shield className="w-4 h-4 mr-2 text-cyan-400" />
                                    ) : (
                                        <User className="w-4 h-4 mr-2 text-green-400" />
                                    )}
                                    <span className={`font-semibold ${user.role === 'admin' ? 'text-cyan-300' : 'text-green-300'}`}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="text-cyan-400 hover:text-cyan-300 mr-4 transition duration-150"
                                        title="Editar Rol"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(user._id, user.email)}
                                        className="text-red-500 hover:text-red-400 transition duration-150"
                                        title="Eliminar Usuario"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        )
                    ))}
                </tbody>
            </table>
            {users.length === 1 && ( // Si solo queda el admin actual en la lista
                <p className="p-6 text-center text-gray-400 text-sm italic">
                    No hay otros usuarios registrados en el sistema.
                </p>
            )}
        </div>
    );
};

// Componente principal del Panel de Gestión de Usuarios
const UserManagementPanel = ({ showNotification }) => {
    // 1. Estados para el formulario de registro
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); // Por defecto 'user'
    const [isRegistering, setIsRegistering] = useState(false);
    
    // 2. Estados para la lista de usuarios y gestión
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // 3. Estados para el Modal de Edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [newRole, setNewRole] = useState('');

    const token = localStorage.getItem('token');
    const currentAdminEmail = localStorage.getItem('email');

    // Función para obtener la lista de usuarios
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Ordenar para poner a los administradores primero
            const sortedUsers = response.data.sort((a, b) => 
                a.role === 'admin' && b.role === 'user' ? -1 : 
                a.role === 'user' && b.role === 'admin' ? 1 : 0
            );
            setUsers(sortedUsers);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            showNotification('Error al cargar la lista de usuarios.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto para cargar usuarios al montar el componente
    useEffect(() => {
        fetchUsers();
    }, []); 

    // Función para el registro de nuevos usuarios
    const handleRegister = async (e) => {
        e.preventDefault();
        if (isRegistering) return;

        if (!email || !password) {
            showNotification('Por favor, complete todos los campos.', 'error');
            return;
        }

        setIsRegistering(true);

        try {
            await axios.post(`${API_BASE_URL}/auth/register`, { email, password, role });
            showNotification('Usuario registrado exitosamente.', 'success');
            setEmail('');
            setPassword('');
            setRole('user');
            fetchUsers(); // Actualizar la lista después del registro
        } catch (error) {
            const message = error.response?.data?.message || 'Error al registrar el usuario.';
            showNotification(message, 'error');
            console.error("Error de registro:", error);
        } finally {
            setIsRegistering(false);
        }
    };

    // --- Funciones de Gestión (Editar y Eliminar) ---

    // 1. Abrir Modal de Edición
    const openEditModal = (user) => {
        setUserToEdit(user);
        setNewRole(user.role);
        setIsEditModalOpen(true);
    };

    // 2. Cerrar Modal de Edición
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setUserToEdit(null);
        setNewRole('');
    };

    // 3. Manejar Edición (Actualizar Rol)
    const handleEditUser = async () => {
        if (!userToEdit || !newRole || newRole === userToEdit.role) {
            closeEditModal();
            return;
        }

        try {
            await axios.put(`${API_BASE_URL}/admin/users/${userToEdit._id}`, 
                { role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            showNotification(`Rol de ${userToEdit.email} actualizado a ${newRole.toUpperCase()}.`, 'success');
            fetchUsers(); // Recargar la lista
            closeEditModal();
        } catch (error) {
            const message = error.response?.data?.message || 'Error al actualizar el rol del usuario.';
            showNotification(message, 'error');
            console.error("Error al actualizar usuario:", error);
        }
    };

    // 4. Manejar Eliminación
    const handleDeleteUser = async (userId, userEmail) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario: ${userEmail}? Esta acción es irreversible.`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showNotification(`Usuario ${userEmail} eliminado exitosamente.`, 'success');
            fetchUsers(); // Recargar la lista
        } catch (error) {
            const message = error.response?.data?.message || 'Error al eliminar el usuario.';
            showNotification(message, 'error');
            console.error("Error al eliminar usuario:", error);
        }
    };


    // --- Componente Modal de Edición ---
    const EditRoleModal = () => {
        if (!isEditModalOpen || !userToEdit) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-lg border border-cyan-700/50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-cyan-400">
                            Editar Rol: {userToEdit.email}
                        </h3>
                        <button onClick={closeEditModal} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nuevo Rol</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        >
                            <option value="user">Usuario (user)</option>
                            <option value="admin">Administrador (admin)</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={closeEditModal}
                            className="px-6 py-2 rounded-lg text-gray-300 bg-gray-600 hover:bg-gray-700 transition duration-150"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleEditUser}
                            disabled={newRole === userToEdit.role}
                            className={`px-6 py-2 rounded-lg font-semibold transition duration-150 ${
                                newRole === userToEdit.role
                                    ? 'bg-gray-500 text-gray-400 cursor-not-allowed'
                                    : 'bg-cyan-600 text-white hover:bg-cyan-500'
                            }`}
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    // --- Renderizado principal del Panel ---
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-800 pb-2 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Gestión de Usuarios
            </h2>
            
            {/* Tarjeta de Registro de Nuevo Usuario */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-8 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Power className="w-5 h-5 mr-2 text-red-500" />
                    Registrar Nuevo Usuario
                </h3>
                <form onSubmit={handleRegister} className="grid sm:grid-cols-3 gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="p-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        required
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="p-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    >
                        <option value="user">Usuario (user)</option>
                        <option value="admin">Administrador (admin)</option>
                    </select>
                    <div className="sm:col-span-3">
                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition duration-150 disabled:bg-red-900 disabled:cursor-not-allowed"
                        >
                            {isRegistering ? 'Registrando...' : 'Registrar Nuevo Usuario'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Listado de Usuarios Existentes */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-cyan-500" />
                    Usuarios Registrados
                </h3>
                
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Cargando usuarios...</div>
                ) : (
                    <UserListTable 
                        users={users} 
                        onEdit={openEditModal} 
                        onDelete={handleDeleteUser} 
                        currentAdminEmail={currentAdminEmail}
                    />
                )}
            </div>
            
            {/* Modal de Edición */}
            <EditRoleModal />
        </div>
    );
};

export default UserManagementPanel;
