import axios from 'axios';
import { toast } from 'react-toastify';
const API = (token) =>
  axios.create({
    baseURL: process.env.REACT_APP_SERVER_URL,
    headers: { Authorization: token },
  });
let url = process.env.REACT_APP_SERVER_URL;

// Mengembalikan { ok, data, error } agar halaman bisa menampilkan pesan error server
const call = async (req) => {
  try {
    const res = await req();
    return { ok: true, data: res.data };
  } catch (e) {
    return {
      ok: false,
      error: e?.response?.data?.error || 'Terjadi kesalahan, coba lagi',
    };
  }
};
export const sendOtp = (phone, purpose) =>
  call(() => axios.post(`${url}/auth/otp/send`, { phone, purpose }));
export const verifyOtp = (body) =>
  call(() => axios.post(`${url}/auth/otp/verify`, body));
export const validUser = async () => {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) return undefined;
    const { data } = await API(token).get(`/auth/valid`);
    return data;
  } catch (error) {
    console.log('error in valid user api');
  }
};
export const searchUsers = async (id) => {
  try {
    const token = localStorage.getItem('userToken');
    return await API(token).get(`/api/user?search=${encodeURIComponent(id)}`);
  } catch (error) {
    console.log('error in search users api');
    return { data: [] };
  }
};
export const updateUser = async (id, body) => {
  try {
    const token = localStorage.getItem('userToken');
    const { data } = await API(token).patch(`/api/users/update/${id}`, body);
    return data;
  } catch (error) {
    console.log('error in update user api');
    toast.error('Something Went Wrong.try Again!');
  }
};
export const checkValid = async () => {
  const data = await validUser();
  if (!data?.user) {
    window.location.href = '/login';
  } else {
    window.location.href = '/chats';
  }
};
