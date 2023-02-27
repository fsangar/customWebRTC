#!/bin/bash

# Desacrgar el ceritficado
openssl s_client -showcerts -connect api-rest-teleasistencia-p1.iesvjp.es:9999 </dev/null 2>/dev/null|openssl x509 -outform PEM > certficado_iesvjp.pem

# Añadir el certificado en el sistema
sudo mv certficado_iesvjp.pem /usr/local/share/ca-certificates/

# Actualizar el ceritificado
sudo update-ca-certificates
