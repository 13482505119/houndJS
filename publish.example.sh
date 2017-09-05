#!/usr/bin/env bash
grunt --testing
ssh -t root@192.168.2.165 /root/wireless-hybrid/upload.sh
scp -r dist HYRoute root@192.168.2.165:/root/wireless-hybrid
ssh -t root@192.168.2.165 "cd /root/wireless-hybrid && forever restart HYRoute/lib/app.js"
