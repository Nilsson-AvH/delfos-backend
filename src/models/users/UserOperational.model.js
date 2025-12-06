import userModel from './User.model.js';
import { ParafiscalesSchema } from './Parafiscales.model.js';

// Operational User: Base User + Parafiscales Data. NO Password.
const OperationalUser = userModel.discriminator('OperationalUser', ParafiscalesSchema);

export default OperationalUser;
