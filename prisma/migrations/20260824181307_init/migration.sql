-- CreateEnum
CREATE TYPE "TaxonomyLevel" AS ENUM ('category', 'group', 'process', 'activity', 'task');

-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('user_task', 'system_task', 'decision_task', 'approval_gateway', 'parallel_gateway', 'timer_event', 'manual_task', 'start_event', 'end_event');

-- CreateTable
CREATE TABLE "taxonomy" (
    "pcf_id" INTEGER NOT NULL,
    "hierarchy_id" TEXT NOT NULL,
    "level" "TaxonomyLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "parent_hierarchy_id" TEXT,
    "description" TEXT NOT NULL,

    CONSTRAINT "taxonomy_pkey" PRIMARY KEY ("pcf_id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apqc_hierarchy_id" TEXT NOT NULL,
    "owner_team" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "source_pcf_id" INTEGER,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_metrics" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "target_value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "kpi_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_metric_readings" (
    "id" TEXT NOT NULL,
    "kpi_metric_id" TEXT NOT NULL,
    "period_label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_metric_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tower_metrics" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "ucl" DOUBLE PRECISION NOT NULL,
    "lcl" DOUBLE PRECISION,
    "warning_ucl" DOUBLE PRECISION,
    "warning_lcl" DOUBLE PRECISION,
    "process_activity_id" TEXT,
    "measurement_method" TEXT,
    "responsible_role" TEXT,
    "review_frequency" TEXT,
    "trigger_description" TEXT,

    CONSTRAINT "control_tower_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_metric_readings" (
    "id" TEXT NOT NULL,
    "control_tower_metric_id" TEXT NOT NULL,
    "sequence_index" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_metric_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_plans" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "control_tower_metric_id" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "notify_role" TEXT NOT NULL,
    "escalation_trigger" TEXT NOT NULL,

    CONSTRAINT "reaction_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lss_tools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "prompt_template" TEXT NOT NULL,

    CONSTRAINT "lss_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_activities" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "parent_activity_id" TEXT,
    "sequence_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "apqc_hierarchy_id" TEXT,
    "elementType" "ElementType" NOT NULL DEFAULT 'user_task',
    "approver_role" TEXT,
    "system_ref" TEXT,
    "decision_ref" TEXT,
    "branch_labels" TEXT[],
    "branch_of_id" TEXT,
    "branch_label" TEXT,

    CONSTRAINT "process_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_diagrams" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "bpmn_xml" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_from" TEXT NOT NULL,
    "edited_by_user" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "process_diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_hierarchy_id_key" ON "taxonomy"("hierarchy_id");

-- CreateIndex
CREATE INDEX "taxonomy_parent_hierarchy_id_idx" ON "taxonomy"("parent_hierarchy_id");

-- CreateIndex
CREATE INDEX "taxonomy_level_idx" ON "taxonomy"("level");

-- CreateIndex
CREATE UNIQUE INDEX "processes_source_pcf_id_key" ON "processes"("source_pcf_id");

-- CreateIndex
CREATE INDEX "processes_apqc_hierarchy_id_idx" ON "processes"("apqc_hierarchy_id");

-- CreateIndex
CREATE INDEX "processes_owner_team_idx" ON "processes"("owner_team");

-- CreateIndex
CREATE INDEX "kpi_metrics_process_id_idx" ON "kpi_metrics"("process_id");

-- CreateIndex
CREATE INDEX "kpi_metric_readings_kpi_metric_id_idx" ON "kpi_metric_readings"("kpi_metric_id");

-- CreateIndex
CREATE INDEX "control_tower_metrics_process_activity_id_idx" ON "control_tower_metrics"("process_activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "control_tower_metrics_process_id_metric_name_key" ON "control_tower_metrics"("process_id", "metric_name");

-- CreateIndex
CREATE INDEX "control_metric_readings_control_tower_metric_id_idx" ON "control_metric_readings"("control_tower_metric_id");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_plans_control_tower_metric_id_key" ON "reaction_plans"("control_tower_metric_id");

-- CreateIndex
CREATE INDEX "reaction_plans_process_id_idx" ON "reaction_plans"("process_id");

-- CreateIndex
CREATE INDEX "process_activities_process_id_idx" ON "process_activities"("process_id");

-- CreateIndex
CREATE INDEX "process_activities_parent_activity_id_idx" ON "process_activities"("parent_activity_id");

-- CreateIndex
CREATE INDEX "process_activities_branch_of_id_idx" ON "process_activities"("branch_of_id");

-- CreateIndex
CREATE INDEX "process_diagrams_process_id_idx" ON "process_diagrams"("process_id");

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_apqc_hierarchy_id_fkey" FOREIGN KEY ("apqc_hierarchy_id") REFERENCES "taxonomy"("hierarchy_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_metrics" ADD CONSTRAINT "kpi_metrics_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_metric_readings" ADD CONSTRAINT "kpi_metric_readings_kpi_metric_id_fkey" FOREIGN KEY ("kpi_metric_id") REFERENCES "kpi_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_tower_metrics" ADD CONSTRAINT "control_tower_metrics_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_tower_metrics" ADD CONSTRAINT "control_tower_metrics_process_activity_id_fkey" FOREIGN KEY ("process_activity_id") REFERENCES "process_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_metric_readings" ADD CONSTRAINT "control_metric_readings_control_tower_metric_id_fkey" FOREIGN KEY ("control_tower_metric_id") REFERENCES "control_tower_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_plans" ADD CONSTRAINT "reaction_plans_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_plans" ADD CONSTRAINT "reaction_plans_control_tower_metric_id_fkey" FOREIGN KEY ("control_tower_metric_id") REFERENCES "control_tower_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_activities" ADD CONSTRAINT "process_activities_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_activities" ADD CONSTRAINT "process_activities_parent_activity_id_fkey" FOREIGN KEY ("parent_activity_id") REFERENCES "process_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_activities" ADD CONSTRAINT "process_activities_apqc_hierarchy_id_fkey" FOREIGN KEY ("apqc_hierarchy_id") REFERENCES "taxonomy"("hierarchy_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_activities" ADD CONSTRAINT "process_activities_branch_of_id_fkey" FOREIGN KEY ("branch_of_id") REFERENCES "process_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_diagrams" ADD CONSTRAINT "process_diagrams_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
