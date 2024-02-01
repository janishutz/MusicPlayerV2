cd frontend/
npm i

npm run electron:build -- --linux deb rpm --win nsis

cd ..
zip -9r musicplayerv2-server.zip backend