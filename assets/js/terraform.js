/* ============================================================
   Anvyzo - terraform.js
   Hover any architecture component to reveal the Terraform that
   provisions it. Desktop / fine-pointer only; purely additive
   (no-op if the popover or nodes are absent).
   ============================================================ */
(function () {
  "use strict";

  var TF = {
    users: {
      file: "humans.tf",
      code:
"# Users aren't provisioned by Terraform.\n" +
"# They're earned. Everything else here isn't.\n" +
"# Hover any service to see how it's built."
    },
    cloudfront: {
      file: "cloudfront.tf",
      code:
'resource "aws_cloudfront_distribution" "cdn" {\n' +
'  enabled             = true\n' +
'  default_root_object = "index.html"\n' +
'  price_class         = "PriceClass_100"\n' +
'\n' +
'  default_cache_behavior {\n' +
'    target_origin_id       = "alb"\n' +
'    viewer_protocol_policy = "redirect-to-https"\n' +
'    compress               = true\n' +
'  }\n' +
'}'
    },
    alb: {
      file: "alb.tf",
      code:
'resource "aws_lb" "api" {\n' +
'  name               = "anvyzo-alb"\n' +
'  load_balancer_type = "application"\n' +
'  internal           = false\n' +
'  security_groups    = [aws_security_group.alb.id]\n' +
'  subnets            = module.vpc.public_subnets\n' +
'}'
    },
    api: {
      file: "ecs_api.tf",
      code:
'resource "aws_ecs_service" "api" {\n' +
'  name            = "anvyzo-api"\n' +
'  cluster         = aws_ecs_cluster.main.id\n' +
'  task_definition = aws_ecs_task_definition.api.arn\n' +
'  desired_count   = 3\n' +
'  launch_type     = "FARGATE"\n' +
'}\n' +
'\n' +
'resource "aws_appautoscaling_target" "api" {\n' +
'  min_capacity       = 3\n' +
'  max_capacity       = 20\n' +
'  scalable_dimension = "ecs:service:DesiredCount"\n' +
'}'
    },
    cache: {
      file: "elasticache.tf",
      code:
'resource "aws_elasticache_replication_group" "redis" {\n' +
'  replication_group_id       = "anvyzo-redis"\n' +
'  engine                     = "redis"\n' +
'  node_type                  = "cache.r6g.large"\n' +
'  num_cache_clusters         = 2\n' +
'  automatic_failover_enabled = true\n' +
'}'
    },
    sqs: {
      file: "sqs.tf",
      code:
'resource "aws_sqs_queue" "tasks" {\n' +
'  name                       = "anvyzo-tasks"\n' +
'  visibility_timeout_seconds = 300\n' +
'  message_retention_seconds  = 86400\n' +
'\n' +
'  redrive_policy = jsonencode({\n' +
'    deadLetterTargetArn = aws_sqs_queue.dlq.arn\n' +
'    maxReceiveCount     = 5\n' +
'  })\n' +
'}'
    },
    workers: {
      file: "ecs_workers.tf",
      code:
'resource "aws_ecs_service" "workers" {\n' +
'  name            = "anvyzo-workers"\n' +
'  cluster         = aws_ecs_cluster.main.id\n' +
'  task_definition = aws_ecs_task_definition.celery.arn\n' +
'  desired_count   = 2\n' +
'}\n' +
'\n' +
'resource "aws_appautoscaling_policy" "workers" {\n' +
'  name        = "scale-on-queue-depth"\n' +
'  policy_type = "TargetTrackingScaling"\n' +
'}'
    },
    rds: {
      file: "rds.tf",
      code:
'resource "aws_db_instance" "postgres" {\n' +
'  identifier        = "anvyzo-db"\n' +
'  engine            = "postgres"\n' +
'  engine_version    = "16.3"\n' +
'  instance_class    = "db.r6g.xlarge"\n' +
'  allocated_storage = 100\n' +
'  multi_az          = true\n' +
'  storage_encrypted = true\n' +
'}'
    },
    cloudwatch: {
      file: "cloudwatch.tf",
      code:
'resource "aws_cloudwatch_metric_alarm" "api_5xx" {\n' +
'  alarm_name          = "api-5xx-high"\n' +
'  comparison_operator = "GreaterThanThreshold"\n' +
'  metric_name         = "HTTPCode_Target_5XX_Count"\n' +
'  namespace           = "AWS/ApplicationELB"\n' +
'  threshold           = 10\n' +
'  evaluation_periods  = 2\n' +
'}'
    },
    s3: {
      file: "s3.tf",
      code:
'resource "aws_s3_bucket" "lake" {\n' +
'  bucket = "anvyzo-data-lake"\n' +
'}\n' +
'\n' +
'resource "aws_s3_bucket_versioning" "lake" {\n' +
'  bucket = aws_s3_bucket.lake.id\n' +
'  versioning_configuration {\n' +
'    status = "Enabled"\n' +
'  }\n' +
'}'
    },
    airflow: {
      file: "mwaa.tf",
      code:
'resource "aws_mwaa_environment" "airflow" {\n' +
'  name              = "anvyzo-airflow"\n' +
'  airflow_version   = "2.9.2"\n' +
'  environment_class = "mw1.medium"\n' +
'  max_workers       = 10\n' +
'  dag_s3_path       = "dags/"\n' +
'  source_bucket_arn = aws_s3_bucket.lake.arn\n' +
'}'
    },
    databricks: {
      file: "databricks.tf",
      code:
'resource "databricks_job" "etl" {\n' +
'  name = "anvyzo-nightly-etl"\n' +
'\n' +
'  new_cluster {\n' +
'    spark_version = "15.4.x-scala2.12"\n' +
'    node_type_id  = "i3.xlarge"\n' +
'    num_workers   = 4\n' +
'  }\n' +
'\n' +
'  notebook_task {\n' +
'    notebook_path = "/etl/transform"\n' +
'  }\n' +
'}'
    },
    redshift: {
      file: "redshift.tf",
      code:
'resource "aws_redshift_cluster" "warehouse" {\n' +
'  cluster_identifier = "anvyzo-dw"\n' +
'  node_type          = "ra3.xlplus"\n' +
'  number_of_nodes    = 2\n' +
'  database_name      = "analytics"\n' +
'  encrypted          = true\n' +
'}'
    },
    route53: {
      file: "route53.tf",
      code:
'resource "aws_route53_record" "app" {\n' +
'  zone_id = aws_route53_zone.main.id\n' +
'  name    = "app.anvyzo.com"\n' +
'  type    = "A"\n' +
'\n' +
'  alias {\n' +
'    name                   = aws_cloudfront_distribution.cdn.domain_name\n' +
'    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id\n' +
'    evaluate_target_health = false\n' +
'  }\n' +
'}'
    },
    waf: {
      file: "waf.tf",
      code:
'resource "aws_wafv2_web_acl" "edge" {\n' +
'  name  = "anvyzo-waf"\n' +
'  scope = "CLOUDFRONT"\n' +
'\n' +
'  default_action {\n' +
'    allow {}\n' +
'  }\n' +
'\n' +
'  rule {\n' +
'    name     = "AWSManagedRulesCommonRuleSet"\n' +
'    priority = 1\n' +
'  }\n' +
'}'
    },
    ecr: {
      file: "ecr.tf",
      code:
'resource "aws_ecr_repository" "api" {\n' +
'  name                 = "anvyzo/api"\n' +
'  image_tag_mutability = "IMMUTABLE"\n' +
'\n' +
'  image_scanning_configuration {\n' +
'    scan_on_push = true\n' +
'  }\n' +
'}'
    },
    githubactions: {
      file: "github_oidc.tf",
      code:
'# CI/CD deploys via OIDC, no long-lived keys.\n' +
'resource "aws_iam_role" "gha_deploy" {\n' +
'  name = "anvyzo-gha-deploy"\n' +
'\n' +
'  assume_role_policy = jsonencode({\n' +
'    Statement = [{\n' +
'      Effect    = "Allow"\n' +
'      Action    = "sts:AssumeRoleWithWebIdentity"\n' +
'      Principal = { Federated = aws_iam_openid_connect_provider.gha.arn }\n' +
'    }]\n' +
'  })\n' +
'}'
    },
    sagemaker: {
      file: "sagemaker.tf",
      code:
'resource "aws_sagemaker_model" "ai" {\n' +
'  name               = "anvyzo-model"\n' +
'  execution_role_arn = aws_iam_role.sagemaker.arn\n' +
'}\n' +
'\n' +
'resource "aws_sagemaker_endpoint" "ai" {\n' +
'  name                 = "anvyzo-inference"\n' +
'  endpoint_config_name = aws_sagemaker_endpoint_configuration.ai.name\n' +
'}'
    }
  };

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // lightweight Terraform syntax highlighter (string-safe via a control-char marker)
  function highlight(src) {
    return src.split("\n").map(function (raw) {
      if (/^\s*#/.test(raw)) return '<span class="c-com">' + esc(raw) + "</span>";
      var line = esc(raw);
      var strs = [];
      line = line.replace(/"[^"]*"/g, function (m) { strs.push(m); return ""; });
      line = line.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="c-num">$1</span>');
      line = line.replace(/\b(resource|module|data|true|false|jsonencode)\b/g, '<span class="c-key">$1</span>');
      line = line.replace(//g, function () { return '<span class="c-str">' + strs.shift() + "</span>"; });
      return line;
    }).join("\n");
  }

  function init() {
    var pop = document.getElementById("tfPopover");
    var nodes = document.querySelectorAll(".arch-node");
    if (!pop || !nodes.length) return;
    if (!window.matchMedia("(min-width: 760px) and (pointer: fine)").matches) return;

    var titleEl = pop.querySelector(".tf-popover__title");
    var codeEl = pop.querySelector(".tf-popover__code code");
    var mx = 0, my = 0, ticking = false, active = false;

    function place() {
      ticking = false;
      if (!active) return;
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var x = mx + 20, y = my + 18;
      if (x + w > window.innerWidth - 14) x = mx - w - 20;
      if (x < 14) x = 14;
      if (y + h > window.innerHeight - 14) y = window.innerHeight - h - 14;
      if (y < 14) y = 14;
      pop.style.left = x + "px";
      pop.style.top = y + "px";
    }

    function onMove(e) {
      mx = e.clientX; my = e.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(place); }
    }

    nodes.forEach(function (node) {
      var id = node.getAttribute("data-id");
      var data = TF[id];
      if (!data) return;

      node.addEventListener("mouseenter", function () {
        // ignore components that haven't assembled yet
        if (parseFloat(getComputedStyle(node).opacity) < 0.5) return;
        titleEl.textContent = data.file;
        codeEl.innerHTML = highlight(data.code);
        active = true;
        pop.classList.add("is-on");
      });
      node.addEventListener("mousemove", onMove);
      node.addEventListener("mouseleave", function () {
        active = false;
        pop.classList.remove("is-on");
      });
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
