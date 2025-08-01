import { readData, writeData } from '../utils/fileHandler.js';

const USERS_FILE = './data/users.json';

export const signupUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const users = await readData(USERS_FILE);
  const userExists = users.find(u => u.email === email);

  if (userExists) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const newUser = {
    id: Date.now(),
    email,
    password,
    role,
  };

  users.push(newUser);
  await writeData(USERS_FILE, users);
  res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const users = await readData('./data/users.json');
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  res.json({ id: user.id, email: user.email, role: user.role });
};
