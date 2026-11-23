# TLS certificates for the nginx service

The nginx service mounts this directory read-only at `/etc/nginx/ssl`, and the
commented HTTPS server block in `nginx/nginx.conf` expects exactly two files:

| File            | Used by nginx directive | Content                               |
| --------------- | ----------------------- | ------------------------------------- |
| `fullchain.pem` | `ssl_certificate`       | Leaf certificate + intermediate chain |
| `privkey.pem`   | `ssl_certificate_key`   | Private key for the certificate       |

The active nginx configuration does not read these files because the HTTPS server
block is still commented out. The directory is mounted read-only into the nginx
container, and the pair becomes required once that block is enabled.

For a real deployment, generate these with Let's Encrypt (certbot) or any CA for
the domain configured as `server_name` in `nginx/nginx.conf`.

For local testing you can generate a self-signed pair (any hostname):

```sh
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem \
  -subj "/CN=localhost"
```

Certificate and key files are gitignored; only this README is versioned.
