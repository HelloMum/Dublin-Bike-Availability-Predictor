#!/bin/bash
# Execute this program in the AWS to setup the basic environment, this was made for docker deploy, might need some changes

FROM debian:stable


# Create a user and set a password
RUN useradd -m -s /bin/bash username && \
    echo 'username:kZhzE5GvxLTHaeKQF6VB' | chpasswd

# Expose SSH port
EXPOSE 2222

# Install OpenSSH server and cron
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server cron \
    && rm -rf /var/lib/apt/lists/*

# Start SSH server
CMD ["/usr/sbin/sshd", "-D"]


# Add cron jobs
USER username
RUN echo "sleep 5 && \
    echo 'This program will check if the cron entry for bike_api_test.py every 5 minutes in home folder, if it is not there it will create one' && \
    echo 'Create CRON entry' && \
    (crontab -l ; echo '*/5 * * * * python /home/bike_scrapper_dynamic.py') | crontab - && \
    echo '*/10 * * * * python /home/weather_report_actual.py' | crontab -" > /tmp/cron-setup.sh && \
    chmod +x /tmp/cron-setup.sh && \
    /tmp/cron-setup.sh && \
    rm /tmp/cron-setup.sh

# Install Miniconda
RUN apt-get update && \
    apt-get install -y wget && \
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh && \
    bash sudo miniconda.sh -b -p /opt/miniconda && \
    rm miniconda.sh

# Set PATH for conda
ENV PATH="/opt/miniconda/bin:${PATH}"

# Create a new Python environment and install packages
USER username
RUN conda create --name Bikes-COMP30830 python=3.11 && \
    /bin/bash -c "source /opt/miniconda/etc/profile.d/conda.sh && conda activate Bikes-COMP30830 && conda install ipykernel" && \
    /bin/bash -c "source /opt/miniconda/etc/profile.d/conda.sh && conda activate Bikes-COMP30830 && ipython kernel install --user --name=Bikes-COMP30830" && \
    /bin/bash -c "source /opt/miniconda/etc/profile.d/conda.sh && conda activate Bikes-COMP30830 && pip install flask mysql-connector-python requests logging datetime"

# Start an interactive shell to keep it running
CMD ["bash"]
