import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityIndicator } from "@/components/common";

import {
  CustomTextField,
  CustomTextAreaField,
  CustomSelectField,
  DatePicker,
  PageSpinner,
  CustomEmptyState,
  PageHeader,
  CustomModal,
  AddPrimaryButton,
} from "@/components/custom";
import { apiProvider } from "@/services/utilities/provider";
import usePermissions from "@/hooks/usePermissions";
import { useEnums } from "@/hooks/useEnums";
import { toLabelItems, convertDateToDateWithoutTime } from "@/utils";
import { Project } from "../types";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { confirmToast } from "@/utils/confirmToast";

const Todos = () => {
  const { has } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiProvider.getAll("projects", controller.signal, true).then((res) => {
      if (Array.isArray(res)) setProjects(res);
      setIsLoading(false);
    });
    return () => controller.abort();
  }, []);

  const handleDelete = (id: string, name: string) => {
    confirmToast({
      title: `Delete "${name}"?`,
      description: "This will permanently delete the project and all its tasks.",
      onConfirm: async () => {
        const res = await apiProvider.remove("projects", id, "", true);
        if (res?.message === "Project deleted") {
          setProjects((prev) => prev.filter((p) => p._id !== id));
          toast.success("Project deleted");
        } else {
          toast.error(res?.message ?? "Failed to delete project");
        }
      },
    });
  };

  const handleCreate = (values: ProjectFormValues) => {
    apiProvider.post("projects/", values, "", true).then((res) => {
      if (res?._id) {
        setProjects((prev) => [
          ...prev,
          { ...res, totalTasks: res.totalTasks ?? 0, doneTasks: res.doneTasks ?? 0 },
        ]);
        setShowForm(false);
        toast.success("Project created");
      } else {
        toast.error(res?.message ?? "Failed to create project");
      }
    });
  };

  const handleUpdate = (id: string, values: ProjectFormValues) => {
    apiProvider.put("projects", values, id, true).then((res) => {
      if (res?._id || res?.name) {
        setProjects((prev) =>
          prev.map((p) => (p._id === id ? { ...p, ...values } : p)),
        );
        setEditingProject(null);
        toast.success("Project updated");
      } else {
        toast.error(res?.message ?? "Failed to update project");
      }
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organise work with Kanban boards"
        actions={
          has("todos-edit") && (
            <AddPrimaryButton
              text="New Project"
              onClick={() => setShowForm(true)}
            />
          )
        }
      />

      <CustomModal
        title="New Project"
        size="sm"
        open={showForm}
        onOpenChange={(open) => !open && setShowForm(false)}
      >
        <ProjectForm
          submitLabel="Create"
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </CustomModal>

      <CustomModal
        title="Edit Project"
        size="sm"
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        {editingProject && (
          <ProjectForm
            submitLabel="Save"
            initialValues={{
              name: editingProject.name,
              description: editingProject.description ?? "",
              priority: editingProject.priority ?? "",
              startDate: editingProject.startDate
                ? editingProject.startDate.slice(0, 10)
                : "",
              expectedEndDate: editingProject.expectedEndDate
                ? editingProject.expectedEndDate.slice(0, 10)
                : "",
            }}
            onSubmit={(values) => handleUpdate(editingProject._id, values)}
            onCancel={() => setEditingProject(null)}
          />
        )}
      </CustomModal>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-5 pb-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-base leading-tight">
                      {project.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created{" "}
                      {new Date(project.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {(has("todos-edit") || has("todos-delete")) && (
                    <RowActionsMenu
                      onEdit={
                        has("todos-edit")
                          ? () => setEditingProject(project)
                          : undefined
                      }
                      onDelete={
                        has("todos-delete")
                          ? () => handleDelete(project._id, project.name)
                          : undefined
                      }
                      triggerClassName="size-7 shrink-0"
                    />
                  )}
                </div>

                {project.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                {(project.priority || project.startDate || project.expectedEndDate) && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {project.priority && (
                      <PriorityIndicator value={project.priority} />
                    )}
                    {project.startDate && (
                      <span>
                        Start: {convertDateToDateWithoutTime(project.startDate)}
                      </span>
                    )}
                    {project.expectedEndDate && (
                      <span>
                        Due: {convertDateToDateWithoutTime(project.expectedEndDate)}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {project.totalTasks} task
                  {project.totalTasks !== 1 ? "s" : ""} · {project.doneTasks}{" "}
                  done
                </p>
                <NavLink to={`${project._id}`}>
                  <Button size="sm" className="w-full">
                    Open Board
                  </Button>
                </NavLink>
              </CardContent>
            </Card>
          ))}
          {projects.length === 0 && (
            <CustomEmptyState
              className="col-span-full py-20"
              icon={FolderKanban}
              title="No projects yet"
              description="Create a project to start organizing work with a Kanban board."
              action={
                has("todos-edit") && (
                  <AddPrimaryButton
                    text="Create First Project"
                    onClick={() => setShowForm(true)}
                  />
                )
              }
            />
          )}
        </div>
      )}
    </section>
  );
};

export default Todos;

export type ProjectFormValues = {
  name: string;
  description: string;
  priority: string;
  startDate: string;
  expectedEndDate: string;
};

const emptyProjectForm: ProjectFormValues = {
  name: "",
  description: "",
  priority: "",
  startDate: "",
  expectedEndDate: "",
};

const ProjectForm = ({
  submitLabel,
  initialValues = emptyProjectForm,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  initialValues?: ProjectFormValues;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
}) => {
  const { contactPriorities } = useEnums();
  const { values, errors, touched, handleChange, handleSubmit, setFieldValue } =
    useFormik<ProjectFormValues>({
      initialValues,
      enableReinitialize: true,
      validationSchema: Yup.object({
        name: Yup.string().min(2, "Too short").required("Name is required"),
        description: Yup.string(),
        priority: Yup.string(),
        startDate: Yup.string(),
        expectedEndDate: Yup.string(),
      }),
      onSubmit,
    });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <CustomTextField
        label="Project Title"
        name="name"
        placeholder="Project name"
        values={values}
        handleChange={handleChange}
        touched={touched}
        errors={errors}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Description</label>
        <CustomTextAreaField
          name="description"
          placeholder="What's this project about?"
          values={values}
          handleChange={handleChange}
          touched={touched}
          errors={errors}
          rows={3}
        />
      </div>
      <CustomSelectField
        label="Priority"
        name="priority"
        placeholder="priority"
        values={values}
        handleChange={handleChange}
        touched={touched}
        errors={errors}
        labelItms={toLabelItems(contactPriorities)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Start Date</label>
          <DatePicker
            value={values.startDate}
            onChange={(v) => setFieldValue("startDate", v)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Expected End Date</label>
          <DatePicker
            value={values.expectedEndDate}
            onChange={(v) => setFieldValue("expectedEndDate", v)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
