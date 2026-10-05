import { z } from 'zod'

// Zod prueba `new Function()` para acelerarse; la política de seguridad (CSP) prohíbe eval, así que
// se desactiva ese modo. La validación funciona igual, solo cambia el motor interno.
z.config({ jitless: true })

export { z }
