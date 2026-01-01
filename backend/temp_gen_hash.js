
import bcrypt from 'bcrypt';
bcrypt.hash('User123!', 12).then(hash => {
    console.log('HASH:' + hash);
});
