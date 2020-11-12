// nvm use 14
const {
  Random, // Utilities for generating secure random numbers 
  KEMs, // Information on supported key encapsulation mechanisms
  KeyEncapsulation, // Key encapsulation class and methods
  Sigs, // Information on supported signature algorithms
  Signature // Signature class and methods
} = require("liboqs-node");
const fs = require('fs');

// usage
// node liboqs.js sign "I love Tteokbokki" > sign
// node liboqs.js checkSign "I love Tteokbokki" $(cat sign)

//console.log(Random)
//console.log(Random.randomBytes(1024));
//console.log(KEMs, KEMs.getEnabledAlgorithms());
//console.log(Sigs.getEnabledAlgorithms())

// const keyEnc = new KeyEncapsulation('LightSaber-KEM');
// const pubKey = keyEnc.generateKeypair();
// const secretKey = keyEnc.exportSecretKey();

// console.log(pubKey, secretKey, keyEnc.encapsulateSecret(pubKey));
function getKeyPairForSign() {
  const s = new Signature('DILITHIUM_4');
  const publicKey = s.generateKeypair();
  const secretKey = s.exportSecretKey();

  fs.writeFileSync(process.env.HOME + '/.gnupg/liboqs/id_dilithium_4', secretKey)
  fs.writeFileSync(process.env.HOME + '/.gnupg/liboqs/id_dilithium_4.pub', publicKey)
}

function sign(message) {
  const secretKey = fs.readFileSync(process.env.HOME + '/.gnupg/liboqs/id_dilithium_4')
  const s = new Signature('DILITHIUM_4', secretKey);
  const buf = Buffer.from(message, 'utf8');
  const signature = s.sign(buf)
  console.log(signature.toString('base64'));
}

function checkSign(message, signatureB64) {
  const publicKey = fs.readFileSync(process.env.HOME + '/.gnupg/liboqs/id_dilithium_4.pub')
  const s = new Signature('DILITHIUM_4');
  console.log(s.verify(Buffer.from(message, 'utf8'), Buffer.from(signatureB64, 'base64'), publicKey))
  console.log
}

switch (process.argv[2]) {
//  case 'gen': getKeyPairForSign(); break;
  case 'sign': sign(process.argv[3]); break;
  case 'checkSign': checkSign(process.argv[3], process.argv[4]); break;
}

