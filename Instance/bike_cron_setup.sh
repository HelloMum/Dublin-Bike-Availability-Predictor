#!/bin/bash
# Execute this program in the AWS instance by using "sudo bash bike_scrapper_dynamic.sh" with execution permissions
# WIP

sleep 5

echo "This program will check if the cron entry for bike_api_test.py every 5 minutes in home folder, if it is not there it will create one"
echo "Create CRON entry"

# The entry will be added with the normal python install. This should be running from miniconda once is setup
new_entry01="*/5 * * * * /usr/bin/python3 /home/$USER/Bikes-COMP30830/bike_scrapper_dynamic.py"
new_entry02="*/5 * * * * /usr/bin/python3 /home/$USER/Bikes-COMP30830/weather_report_actual.py"

# This will check to see if is already there
if ! crontab -l | fgrep -q "$new_entry"; then
    #write out current crontab
    crontab -l > allcrons
    #echo new cron into cron file
    echo "$new_entry01" >> allcrons
    echo "$new_entry02" >> allcrons
    display_all_crons allcrons # This should allocate the user to find their conda variable
    #install new cron file
    crontab allcrons
    rm allcrons
fi