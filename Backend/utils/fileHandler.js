import fs from 'fs-extra';

export const readData = async (file) => {
  try {
    const exists = await fs.pathExists(file);
    if (!exists) {
      // If file doesn't exist, create it with an empty array
      await fs.writeJSON(file, []);
      return [];
    }
    return await fs.readJSON(file);
  } catch (err) {
    console.error('Error reading file:', err);
    return [];
  }
};

export const writeData = async (file, data) => {
  try {
    await fs.writeJSON(file, data, { spaces: 2 });
  } catch (err) {
    console.error('Error writing file:', err);
  }
};
