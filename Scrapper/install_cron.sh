#!/bin/bash
# Execute this program in the AWS instance by using "sudo bash install_cron.sh" with execution permissions

echo "The script will now install cron on the AWS instance"

sleep 5

apt update
apt upgrade
apt install cron
systemctl enable cron

echo "Installations should be completed"