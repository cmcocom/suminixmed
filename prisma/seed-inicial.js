"use strict";
/**
 * Script de Seed Inicial - SIMPLIFICADO
 * Crea usuario UNIDADC con acceso total
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var crypto_1 = require("crypto");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, usuario, rolUNIDADC;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Iniciando seed de base de datos...\n');
                    // 1. Crear usuario UNIDADC
                    console.log('👤 Creando usuario UNIDADC...');
                    return [4 /*yield*/, bcryptjs_1.default.hash('cmcocom.', 10)];
                case 1:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'cmcocom@unidadc.com' },
                            update: {},
                            create: {
                                id: (0, crypto_1.randomUUID)(),
                                email: 'cmcocom@unidadc.com',
                                password: hashedPassword,
                                name: 'Cristian Cocom - UNIDADC',
                                activo: true,
                                emailVerified: new Date()
                            }
                        })];
                case 2:
                    usuario = _a.sent();
                    console.log('✅ Usuario creado:', usuario.email);
                    // 2. Crear rol UNIDADC
                    console.log('\n📋 Creando rol UNIDADC...');
                    return [4 /*yield*/, prisma.rbac_roles.upsert({
                            where: { name: 'UNIDADC' },
                            update: {},
                            create: {
                                id: 'rol-unidadc',
                                name: 'UNIDADC',
                                description: 'Supervisor con acceso completo - 100%',
                                is_active: true,
                                created_by: usuario.id
                            }
                        })];
                case 3:
                    rolUNIDADC = _a.sent();
                    console.log('✅ Rol UNIDADC creado');
                    // 3. Asignar rol al usuario
                    console.log('\n🔗 Asignando rol al usuario...');
                    return [4 /*yield*/, prisma.rbac_user_roles.deleteMany({
                            where: { user_id: usuario.id }
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.rbac_user_roles.create({
                            data: {
                                id: (0, crypto_1.randomUUID)(),
                                user_id: usuario.id,
                                role_id: rolUNIDADC.id,
                                assigned_by: usuario.id
                            }
                        })];
                case 5:
                    _a.sent();
                    console.log('✅ Rol asignado');
                    console.log('\n✨ Seed completado exitosamente!\n');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📧 Email:    cmcocom@unidadc.com');
                    console.log('🔑 Password: cmcocom.');
                    console.log('👤 Rol:      UNIDADC (Acceso Total 100%)');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    console.log('ℹ️  El rol UNIDADC tiene acceso completo mediante');
                    console.log('   el sistema RBAC legacy (lib/auth-roles.ts)\n');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error('❌ Error en seed:', e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
