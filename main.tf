provider "aws" {
  region = "eu-central-1"
  profile = "myaws"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnet" "default_subnet" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }

  filter {
    name   = "availability-zone"
    values = ["eu-central-1a"]
  }
}

resource "aws_security_group" "instance_sg" {
  name   = "my-ai-blog-instance-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH
  ingress {
    description = "Allow SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_key_pair" "deployer" {
  key_name   = "terraform-deployer-key"
  public_key = file("~/.ssh/id_rsa.pub") # Path to your public SSH key
}


resource "aws_instance" "docker_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3a.micro"
  subnet_id              = data.aws_subnet.default_subnet.id
  vpc_security_group_ids = [aws_security_group.instance_sg.id]
  key_name               = aws_key_pair.deployer.key_name

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
  EOF

  tags = {
    Name = "my-ai-blog-instance"
  }
}

resource "null_resource" "build_image" {
  provisioner "local-exec" {
    command = "docker build -t blogapp . && docker save blogapp:latest -o blogapp_image.tar"
  }
  triggers = {
    always_run = timestamp() # Force re-run if necessary
  }
}

resource "null_resource" "remote_commands" {
  depends_on = [aws_instance.docker_instance, null_resource.build_image]

  triggers = {
    always_run = timestamp()
  }


  provisioner "file" {
    source      = "${path.module}/blogapp_image.tar"
    destination = "/home/ec2-user/blogapp_image.tar"
    
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file("~/.ssh/id_rsa")
      host        = aws_instance.docker_instance.public_ip
    }
  }

  provisioner "file" {
    source      = "${path.module}/.env"
    destination = "/home/ec2-user/.env"
    
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file("~/.ssh/id_rsa")
      host        = aws_instance.docker_instance.public_ip
    }
  }

  provisioner "remote-exec" {
    inline = [
      "while ! command -v docker &> /dev/null; do echo 'Waiting for Docker to be installed...'; sleep 1; done",
      "while ! sudo docker info &> /dev/null; do echo 'Waiting for Docker to start...'; sleep 1; done",
      "sudo docker system prune -af",
      "docker load -i /home/ec2-user/blogapp_image.tar",
      "sudo docker rm -f blogapp || true",
      "sudo docker run --env-file .env -d -p 80:3500 --name blogapp -v /home/ec2-user/db:/app/db blogapp"
    ]

    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = file("~/.ssh/id_rsa")
      host        = aws_instance.docker_instance.public_ip
    }
  }

  
}

output "instance_public_ip" {
  value = aws_instance.docker_instance.public_ip
}
