export const validarMail = (email) => {
  const regex = /\S+@\S+\.\S+/; //valido que sea así: texto@texto.texto (sin espacios)
  return regex.test(email);
};