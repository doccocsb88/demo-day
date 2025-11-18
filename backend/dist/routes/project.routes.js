"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const router = (0, express_1.Router)();
router.post('/', project_controller_1.createProject);
router.get('/', project_controller_1.listProjects);
router.get('/:id', project_controller_1.getProject);
router.put('/:id', project_controller_1.updateProject);
router.delete('/:id', project_controller_1.deleteProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map